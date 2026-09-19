import { InternalError } from "../errors/errors.js";

export interface SecretsManager {
  getSecret(key: string, defaultValue?: string): Promise<string | undefined>;
  getRequiredSecret(key: string): Promise<string>;
  hasSecret(key: string): Promise<boolean>;
  setSecret?(key: string, value: string): Promise<void>;
}

export class EnvSecretsManager implements SecretsManager {
  constructor(private prefix: string = "") {}

  async getSecret(key: string, defaultValue?: string): Promise<string | undefined> {
    const fullKey = this.prefix ? `${this.prefix}_${key}` : key;
    return process.env[fullKey] ?? defaultValue;
  }

  async getRequiredSecret(key: string): Promise<string> {
    const val = await this.getSecret(key);
    if (!val) {
      throw new InternalError(`Required secret '${key}' is missing from environment`);
    }
    return val;
  }

  async hasSecret(key: string): Promise<boolean> {
    const val = await this.getSecret(key);
    return val !== undefined && val !== "";
  }
}

export class MemorySecretsManager implements SecretsManager {
  private secrets = new Map<string, string>();

  constructor(initialSecrets?: Record<string, string>) {
    if (initialSecrets) {
      for (const [k, v] of Object.entries(initialSecrets)) {
        this.secrets.set(k, v);
      }
    }
  }

  async getSecret(key: string, defaultValue?: string): Promise<string | undefined> {
    return this.secrets.get(key) ?? defaultValue;
  }

  async getRequiredSecret(key: string): Promise<string> {
    const val = this.secrets.get(key);
    if (!val) {
      throw new InternalError(`Required secret '${key}' is missing`);
    }
    return val;
  }

  async hasSecret(key: string): Promise<boolean> {
    return this.secrets.has(key);
  }

  async setSecret(key: string, value: string): Promise<void> {
    this.secrets.set(key, value);
  }
}

export class CachedSecretsManager implements SecretsManager {
  private cache = new Map<string, { value: string | undefined; expiresAt: number }>();

  constructor(
    private upstream: SecretsManager,
    private ttlMs: number = 300_000 // 5 minutes
  ) {}

  async getSecret(key: string, defaultValue?: string): Promise<string | undefined> {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value ?? defaultValue;
    }

    const fetched = await this.upstream.getSecret(key, defaultValue);
    this.cache.set(key, { value: fetched, expiresAt: Date.now() + this.ttlMs });
    return fetched;
  }

  async getRequiredSecret(key: string): Promise<string> {
    const val = await this.getSecret(key);
    if (!val) {
      throw new InternalError(`Required secret '${key}' is missing`);
    }
    return val;
  }

  async hasSecret(key: string): Promise<boolean> {
    const val = await this.getSecret(key);
    return val !== undefined && val !== "";
  }

  async setSecret(key: string, value: string): Promise<void> {
    if (this.upstream.setSecret) {
      await this.upstream.setSecret(key, value);
    }
    this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

/**
 * Masks a secret string for safe logging.
 */
export function maskSecret(value?: string): string {
  if (!value) return "[EMPTY]";
  if (value.length <= 8) return "********";
  return `${"*".repeat(value.length - 4)}${value.slice(-4)}`;
}

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /apikey/i,
  /api_key/i,
  /private_key/i,
  /credit_card/i,
  /cvv/i,
];

/**
 * Recursively redacts sensitive keys from objects before logging.
 */
export function redactSensitiveObject<T>(input: T): T {
  if (input === null || typeof input !== "object") {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveObject(item)) as unknown as T;
  }

  const output: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pat) => pat.test(k));
    if (isSensitive) {
      output[k] = typeof v === "string" ? maskSecret(v) : "[REDACTED]";
    } else if (typeof v === "object" && v !== null) {
      output[k] = redactSensitiveObject(v);
    } else {
      output[k] = v;
    }
  }

  return output as T;
}
