export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
  retryAfterSeconds: number;
}

export interface RateLimiterStore {
  increment(key: string, windowMs: number): Promise<{ count: number; firstRequestMs: number }>;
  reset(key: string): Promise<void>;
}

export class InMemoryRateLimiterStore implements RateLimiterStore {
  private hits: Map<string, { count: number; firstRequestMs: number }> = new Map();

  async increment(key: string, windowMs: number): Promise<{ count: number; firstRequestMs: number }> {
    const now = Date.now();
    const entry = this.hits.get(key);

    if (!entry || now - entry.firstRequestMs > windowMs) {
      const newEntry = { count: 1, firstRequestMs: now };
      this.hits.set(key, newEntry);
      return newEntry;
    }

    entry.count += 1;
    return entry;
  }

  async reset(key: string): Promise<void> {
    this.hits.delete(key);
  }
}

export class RateLimiter {
  private store: RateLimiterStore;
  private configs: Map<string, RateLimitConfig> = new Map();

  constructor(store?: RateLimiterStore) {
    this.store = store || new InMemoryRateLimiterStore();

    // Default rate limit configurations
    this.setConfig("login", { windowMs: 15 * 60 * 1000, maxRequests: 5 });
    this.setConfig("signup", { windowMs: 60 * 60 * 1000, maxRequests: 5 });
    this.setConfig("password_reset", { windowMs: 15 * 60 * 1000, maxRequests: 3 });
    this.setConfig("magic_link", { windowMs: 15 * 60 * 1000, maxRequests: 3 });
    this.setConfig("mfa_challenge", { windowMs: 10 * 60 * 1000, maxRequests: 5 });
    this.setConfig("email_change", { windowMs: 60 * 60 * 1000, maxRequests: 3 });
    this.setConfig("api", { windowMs: 60 * 1000, maxRequests: 100 });
  }

  setConfig(action: string, config: RateLimitConfig): void {
    this.configs.set(action, config);
  }

  /**
   * Checks and consumes a rate limit quota for a given action and identifier (IP or account)
   */
  async checkRateLimit(action: string, identifier: string): Promise<RateLimitResult> {
    const config = this.configs.get(action) || { windowMs: 60 * 1000, maxRequests: 60 };
    const key = `ratelimit:${action}:${identifier}`;

    const { count, firstRequestMs } = await this.store.increment(key, config.windowMs);
    const now = Date.now();
    const resetTimeMs = firstRequestMs + config.windowMs;
    const remaining = Math.max(0, config.maxRequests - count);
    const allowed = count <= config.maxRequests;
    const retryAfterSeconds = allowed ? 0 : Math.ceil((resetTimeMs - now) / 1000);

    return {
      allowed,
      limit: config.maxRequests,
      remaining,
      resetTimeMs,
      retryAfterSeconds,
    };
  }

  /**
   * Dual-layer rate limiting: checks both IP address and account identifier
   */
  async checkDualRateLimit(
    action: string,
    ip: string,
    accountIdentifier?: string
  ): Promise<RateLimitResult> {
    // If specific action:ip config doesn't exist, use base action config
    const ipAction = this.configs.has(`${action}:ip`) ? `${action}:ip` : action;
    const ipResult = await this.checkRateLimit(ipAction, ip);
    if (!ipResult.allowed) {
      return ipResult;
    }

    // 2. Check Account rate limit if provided
    if (accountIdentifier) {
      const accountAction = this.configs.has(`${action}:account`) ? `${action}:account` : action;
      const accountResult = await this.checkRateLimit(accountAction, accountIdentifier.toLowerCase());
      if (!accountResult.allowed) {
        return accountResult;
      }
    }

    return ipResult;
  }

  /**
   * Resets rate limit for a given key upon successful action (e.g. successful login)
   */
  async resetRateLimit(action: string, identifier: string): Promise<void> {
    const key = `ratelimit:${action}:${identifier}`;
    await this.store.reset(key);
  }
}
