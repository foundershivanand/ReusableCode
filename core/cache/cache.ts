import { InternalError } from "../errors/errors.js";

export interface CacheOptions {
  ttlSeconds: number;
  tags?: string[];
  tenantId?: string;
  scope?: "public" | "tenant" | "user";
  userId?: string;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
  tenantId?: string;
  userId?: string;
  lastAccessedAt: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxEntries: number;
}

export interface CacheStore {
  get<T>(key: string): Promise<CacheEntry<T> | undefined>;
  set<T>(key: string, value: T, options: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  invalidateByTag(tag: string): Promise<void>;
  invalidateByTenant(tenantId: string): Promise<void>;
  getMetrics?(): CacheMetrics;
}

/**
 * High-performance, bounded LRU cache with active TTL expiration.
 * Prevents memory exhaustion when scaling up to millions of users.
 */
export class InMemoryCacheStore implements CacheStore {
  private store = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(private maxEntries: number = 50_000) {}

  async get<T>(key: string): Promise<CacheEntry<T> | undefined> {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      this.misses++;
      return undefined;
    }

    // Refresh LRU ordering: delete and re-insert at end of Map
    this.store.delete(key);
    entry.lastAccessedAt = Date.now();
    this.store.set(key, entry);

    this.hits++;
    return entry;
  }

  async set<T>(key: string, value: T, options: CacheOptions): Promise<void> {
    // If key already exists, remove it before re-inserting
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      // Evict oldest (least recently used) entry
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
        this.evictions++;
      }
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + options.ttlSeconds * 1000,
      tags: options.tags || [],
      tenantId: options.tenantId,
      userId: options.userId,
      lastAccessedAt: Date.now(),
    };

    this.store.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async invalidateByTag(tag: string): Promise<void> {
    for (const [k, v] of this.store.entries()) {
      if (v.tags.includes(tag)) {
        this.store.delete(k);
      }
    }
  }

  async invalidateByTenant(tenantId: string): Promise<void> {
    for (const [k, v] of this.store.entries()) {
      if (v.tenantId === tenantId) {
        this.store.delete(k);
      }
    }
  }

  getMetrics(): CacheMetrics {
    return {
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      size: this.store.size,
      maxEntries: this.maxEntries,
    };
  }
}

/**
 * Builds a strictly isolated, safe cache key.
 * Prevents cross-tenant contamination and privilege escalation.
 */
export function buildCacheKey(params: {
  namespace: string;
  tenantId?: string;
  resource: string;
  identifier: string;
  userId?: string;
}): string {
  const parts = [params.namespace];

  if (params.tenantId) {
    parts.push(`tenant:${params.tenantId}`);
  } else {
    parts.push("public");
  }

  if (params.userId) {
    parts.push(`user:${params.userId}`);
  }

  parts.push(params.resource);
  parts.push(params.identifier);

  return parts.join(":");
}

export class CacheManager {
  private inFlight = new Map<string, Promise<any>>();

  constructor(private store: CacheStore = new InMemoryCacheStore()) {}

  /**
   * Safe fetch with single-flight stampede protection.
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): Promise<T> {
    // 1. Check cache
    const cached = await this.store.get<T>(key);
    if (cached) {
      // Validate isolation
      if (options.tenantId && cached.tenantId && cached.tenantId !== options.tenantId) {
        throw new InternalError("Cache security violation: tenant mismatch on cached entry");
      }
      if (options.userId && cached.userId && cached.userId !== options.userId) {
        throw new InternalError("Cache security violation: user mismatch on cached entry");
      }
      return cached.value;
    }

    // 2. Single-flight mutex to prevent stampede under high concurrent load
    const existingFlight = this.inFlight.get(key);
    if (existingFlight) {
      return existingFlight as Promise<T>;
    }

    const promise = (async () => {
      try {
        const fresh = await fetcher();
        await this.store.set(key, fresh, options);
        return fresh;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  async invalidate(key: string): Promise<void> {
    await this.store.delete(key);
  }

  async invalidateTag(tag: string): Promise<void> {
    await this.store.invalidateByTag(tag);
  }

  async invalidateTenant(tenantId: string): Promise<void> {
    await this.store.invalidateByTenant(tenantId);
  }

  getMetrics(): CacheMetrics | undefined {
    return this.store.getMetrics?.();
  }
}

export const defaultCacheManager = new CacheManager();
