import { RateLimiterStore } from "./rate-limiter.js";
import { SessionRecord, UserRecord } from "./repository.js";

/**
 * Minimal Redis Client interface compatible with ioredis, @upstash/redis, and node-redis
 */
export interface MinimalRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<unknown>;
  del(key: string | string[]): Promise<number>;
  incr(key: string): Promise<number>;
  pexpire(key: string, milliseconds: number): Promise<number>;
  pttl(key: string): Promise<number>;
}

/**
 * Distributed Redis-backed Rate Limiter Store for high concurrency and horizontal scaling
 */
export class RedisRateLimiterStore implements RateLimiterStore {
  private redis: MinimalRedisClient;
  private keyPrefix: string;

  constructor(redis: MinimalRedisClient, keyPrefix: string = "rl:") {
    this.redis = redis;
    this.keyPrefix = keyPrefix;
  }

  async increment(
    key: string,
    windowMs: number
  ): Promise<{ count: number; firstRequestMs: number }> {
    const redisKey = `${this.keyPrefix}${key}`;
    const now = Date.now();

    const count = await this.redis.incr(redisKey);
    if (count === 1) {
      // First request in this window: set TTL
      await this.redis.pexpire(redisKey, windowMs);
      return { count, firstRequestMs: now };
    }

    const ttl = await this.redis.pttl(redisKey);
    const firstRequestMs = ttl > 0 ? now - (windowMs - ttl) : now;

    return { count, firstRequestMs };
  }

  async reset(key: string): Promise<void> {
    const redisKey = `${this.keyPrefix}${key}`;
    await this.redis.del(redisKey);
  }
}

/**
 * High-performance Redis Session Cache for 1,000,000 users.
 * Reduces database read load by caching active session/user tuples with TTL.
 */
export class RedisSessionCache {
  private redis: MinimalRedisClient;
  private keyPrefix: string;
  private defaultTtlSeconds: number;

  constructor(
    redis: MinimalRedisClient,
    keyPrefix: string = "sess_cache:",
    defaultTtlSeconds: number = 1800 // 30 minutes
  ) {
    this.redis = redis;
    this.keyPrefix = keyPrefix;
    this.defaultTtlSeconds = defaultTtlSeconds;
  }

  async get(
    tokenHash: string
  ): Promise<{ session: SessionRecord; user: UserRecord } | null> {
    const cached = await this.redis.get(`${this.keyPrefix}${tokenHash}`);
    if (!cached) return null;

    try {
      const parsed = JSON.parse(cached);
      return {
        session: {
          ...parsed.session,
          createdAt: new Date(parsed.session.createdAt),
          lastActiveAt: new Date(parsed.session.lastActiveAt),
          expiresAt: new Date(parsed.session.expiresAt),
        },
        user: {
          ...parsed.user,
          createdAt: new Date(parsed.user.createdAt),
          updatedAt: new Date(parsed.user.updatedAt),
          deletedAt: parsed.user.deletedAt ? new Date(parsed.user.deletedAt) : null,
          lockedUntil: parsed.user.lockedUntil ? new Date(parsed.user.lockedUntil) : null,
        },
      };
    } catch {
      return null;
    }
  }

  async set(
    tokenHash: string,
    data: { session: SessionRecord; user: UserRecord },
    ttlSeconds: number = this.defaultTtlSeconds
  ): Promise<void> {
    await this.redis.set(
      `${this.keyPrefix}${tokenHash}`,
      JSON.stringify(data),
      "EX",
      ttlSeconds
    );
  }

  async invalidate(tokenHash: string): Promise<void> {
    await this.redis.del(`${this.keyPrefix}${tokenHash}`);
  }
}
