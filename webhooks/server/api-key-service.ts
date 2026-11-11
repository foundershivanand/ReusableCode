import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { IWebhookRepository } from "./repository.js";
import {
  type ApiKey,
  type CreateApiKeyInput,
  CreateApiKeyInputSchema
} from "../schemas/webhook-schemas.js";

export class ApiKeyService {
  private keyUsageCounters: Map<string, { count: number; windowStart: number }> = new Map();

  constructor(private readonly repository: IWebhookRepository) {}

  async generateApiKey(
    input: CreateApiKeyInput,
    creatorAllowedScopes: string[] = ["*"]
  ): Promise<{ apiKey: ApiKey; rawKey: string }> {
    const validated = CreateApiKeyInputSchema.parse(input);

    // Scope hierarchy validation
    if (!creatorAllowedScopes.includes("*")) {
      const creatorScopesSet = new Set(creatorAllowedScopes);
      for (const scope of validated.scopes) {
        if (!creatorScopesSet.has(scope)) {
          throw new Error(
            `Scope hierarchy violation: Cannot grant scope '${scope}' exceeding creator permissions`
          );
        }
      }
    }

    const prefix = "pk_live_" + randomBytes(4).toString("hex");
    const secretPart = randomBytes(24).toString("hex");
    const rawKey = `${prefix}_${secretPart}`;

    const keyHash = this.hashKey(rawKey);

    const expiresAt = validated.expiresInDays
      ? new Date(Date.now() + validated.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const apiKey: ApiKey = {
      id: `key_${Date.now()}_${randomBytes(4).toString("hex")}`,
      tenantId: validated.tenantId,
      userId: validated.userId,
      name: validated.name,
      prefix,
      keyHash,
      scopes: validated.scopes,
      rateLimitPerMinute: validated.rateLimitPerMinute,
      lifecycleState: "ACTIVE",
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const saved = await this.repository.saveApiKey(apiKey);
    return { apiKey: saved, rawKey };
  }

  async authenticateKey(
    rawKey: string,
    requiredScope?: string,
    metadata?: { ip?: string; userAgent?: string }
  ): Promise<ApiKey> {
    if (!rawKey || !rawKey.startsWith("pk_live_")) {
      throw new Error("Invalid API key format");
    }

    const parts = rawKey.split("_");
    if (parts.length < 4) {
      throw new Error("Malformed API key");
    }

    const prefix = `${parts[0]}_${parts[1]}_${parts[2]}`;
    const key = await this.repository.getApiKeyByPrefix(prefix);
    if (!key) {
      throw new Error("API key not found");
    }

    // Verify key hash in constant time
    const computedHash = this.hashKey(rawKey);
    const hashBuf = Buffer.from(computedHash, "utf-8");
    const storedBuf = Buffer.from(key.keyHash, "utf-8");

    if (hashBuf.length !== storedBuf.length || !timingSafeEqual(hashBuf, storedBuf)) {
      throw new Error("Invalid API key secret");
    }

    // Lifecycle check
    if (key.lifecycleState !== "ACTIVE" && key.lifecycleState !== "ROTATED") {
      throw new Error(`API key is ${key.lifecycleState}`);
    }

    // Expiration check
    if (key.expiresAt && new Date() > new Date(key.expiresAt)) {
      key.lifecycleState = "EXPIRED";
      await this.repository.saveApiKey(key);
      throw new Error("API key has expired");
    }

    // Scope check
    if (requiredScope && !key.scopes.includes("*") && !key.scopes.includes(requiredScope)) {
      throw new Error(`API key lacks required scope '${requiredScope}'`);
    }

    // Rate limiting
    this.checkRateLimit(key.id, key.rateLimitPerMinute);

    // Update usage
    key.lastUsedAt = new Date();
    if (metadata?.ip) key.lastUsedIp = metadata.ip;
    if (metadata?.userAgent) key.lastUsedUserAgent = metadata.userAgent;
    await this.repository.saveApiKey(key);

    return key;
  }

  async rotateApiKey(
    keyId: string,
    gracePeriodHours: number = 24
  ): Promise<{ newApiKey: ApiKey; rawKey: string }> {
    const oldKey = await this.repository.getApiKeyById(keyId);
    if (!oldKey) throw new Error(`Key '${keyId}' not found`);

    // Mark old key as ROTATED with grace period
    oldKey.lifecycleState = "ROTATED";
    oldKey.expiresAt = new Date(Date.now() + gracePeriodHours * 60 * 60 * 1000);
    await this.repository.saveApiKey(oldKey);

    // Generate new replacement key
    const generated = await this.generateApiKey({
      tenantId: oldKey.tenantId,
      userId: oldKey.userId,
      name: `${oldKey.name} (Rotated)`,
      scopes: oldKey.scopes,
      rateLimitPerMinute: oldKey.rateLimitPerMinute
    });
    return {
      newApiKey: generated.apiKey,
      rawKey: generated.rawKey
    };
  }

  async revokeApiKey(keyId: string): Promise<void> {
    const key = await this.repository.getApiKeyById(keyId);
    if (!key) throw new Error(`Key '${keyId}' not found`);

    key.lifecycleState = "REVOKED";
    await this.repository.saveApiKey(key);
  }

  private hashKey(rawKey: string): string {
    return createHash("sha256").update(rawKey).digest("hex");
  }

  private checkRateLimit(keyId: string, limitPerMinute: number) {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const current = this.keyUsageCounters.get(keyId) || { count: 0, windowStart: now };

    if (now - current.windowStart > windowMs) {
      current.count = 1;
      current.windowStart = now;
    } else {
      current.count++;
      if (current.count > limitPerMinute) {
        throw new Error(`API key rate limit exceeded (${limitPerMinute} req/min)`);
      }
    }

    this.keyUsageCounters.set(keyId, current);
  }
}
