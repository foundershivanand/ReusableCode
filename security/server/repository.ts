import type { RateLimitConfig, RateLimitResult } from "../schemas/index.js";

export interface SecurityRepository {
  checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult>;
  resetRateLimit(key: string): Promise<void>;
  isIpBlocked(ip: string): Promise<boolean>;
  blockIp(ip: string, durationSeconds: number, reason: string): Promise<void>;
  unblockIp(ip: string): Promise<void>;
  recordSecurityEvent(event: { type: string; ip: string; path: string; details: any }): Promise<void>;
}

export class InMemorySecurityRepository implements SecurityRepository {
  // Key: rateLimitKey -> array of request timestamps (ms)
  private slidingWindows: Map<string, number[]> = new Map();
  private blockedIps: Map<string, { blockedUntil: Date; reason: string }> = new Map();
  private securityEvents: any[] = [];

  async checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
    const windowStart = now - windowMs;

    let timestamps = this.slidingWindows.get(key) || [];
    // Filter timestamps within sliding window
    timestamps = timestamps.filter((t) => t > windowStart);

    const count = timestamps.length;
    const allowed = count < config.maxRequests;
    const resetAt = new Date(now + windowMs);

    if (allowed) {
      timestamps.push(now);
      this.slidingWindows.set(key, timestamps);
      return {
        allowed: true,
        remaining: Math.max(0, config.maxRequests - (count + 1)),
        limit: config.maxRequests,
        resetAt,
        retryAfterSeconds: 0
      };
    }

    // Rate limit exceeded
    const oldest = timestamps[0] || now;
    const retryAfterMs = Math.max(0, oldest + windowMs - now);
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

    return {
      allowed: false,
      remaining: 0,
      limit: config.maxRequests,
      resetAt,
      retryAfterSeconds: Math.max(1, retryAfterSeconds)
    };
  }

  async resetRateLimit(key: string): Promise<void> {
    this.slidingWindows.delete(key);
  }

  async isIpBlocked(ip: string): Promise<boolean> {
    const record = this.blockedIps.get(ip);
    if (!record) return false;
    if (record.blockedUntil < new Date()) {
      this.blockedIps.delete(ip);
      return false;
    }
    return true;
  }

  async blockIp(ip: string, durationSeconds: number, reason: string): Promise<void> {
    const blockedUntil = new Date(Date.now() + durationSeconds * 1000);
    this.blockedIps.set(ip, { blockedUntil, reason });
  }

  async unblockIp(ip: string): Promise<void> {
    this.blockedIps.delete(ip);
  }

  async recordSecurityEvent(event: { type: string; ip: string; path: string; details: any }): Promise<void> {
    this.securityEvents.push({ ...event, timestamp: new Date() });
  }
}
