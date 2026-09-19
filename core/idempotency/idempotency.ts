import { createHash } from "node:crypto";
import { ConflictError } from "../errors/errors.js";
import { logger } from "../observability/tracing.js";

export type IdempotencyStatus = "PROCESSING" | "COMPLETED" | "FAILED";

export interface IdempotencyRecord {
  key: string;
  requestHash: string;
  tenantId?: string;
  status: IdempotencyStatus;
  statusCode?: number;
  responseBody?: unknown;
  createdAt: number;
  expiresAt: number;
}

export interface IdempotencyStore {
  get(key: string): Promise<IdempotencyRecord | undefined>;
  set(record: IdempotencyRecord): Promise<void>;
  update(key: string, updates: Partial<IdempotencyRecord>): Promise<void>;
}

/**
 * Bounded, memory-safe idempotency store with LRU eviction and TTL cleanup.
 * Designed to handle high-throughput workloads and millions of requests.
 */
export class InMemoryIdempotencyStore implements IdempotencyStore {
  private records = new Map<string, IdempotencyRecord>();

  constructor(private maxEntries: number = 50_000) {}

  async get(key: string): Promise<IdempotencyRecord | undefined> {
    const record = this.records.get(key);
    if (!record) return undefined;
    if (record.expiresAt < Date.now()) {
      this.records.delete(key);
      return undefined;
    }
    // Refresh LRU order
    this.records.delete(key);
    this.records.set(key, record);
    return record;
  }

  async set(record: IdempotencyRecord): Promise<void> {
    if (this.records.has(record.key)) {
      this.records.delete(record.key);
    } else if (this.records.size >= this.maxEntries) {
      // Evict oldest record
      const oldestKey = this.records.keys().next().value;
      if (oldestKey) {
        this.records.delete(oldestKey);
      }
    }
    this.records.set(record.key, record);
  }

  async update(key: string, updates: Partial<IdempotencyRecord>): Promise<void> {
    const existing = this.records.get(key);
    if (existing) {
      const updated = { ...existing, ...updates };
      this.records.delete(key);
      this.records.set(key, updated);
    }
  }
}

export function computeRequestHash(payload: {
  method: string;
  path: string;
  body?: unknown;
  tenantId?: string;
}): string {
  const content = JSON.stringify({
    method: payload.method.toUpperCase(),
    path: payload.path,
    body: payload.body || null,
    tenantId: payload.tenantId || null,
  });
  return createHash("sha256").update(content).digest("hex");
}

export class IdempotencyManager {
  private inFlight = new Map<
    string,
    { hash: string; promise: Promise<{ isReplay: boolean; statusCode: number; body: any }> }
  >();

  constructor(
    private store: IdempotencyStore = new InMemoryIdempotencyStore(),
    private defaultTtlMs: number = 86_400_000, // 24 hours
    private lockTimeoutMs: number = 30_000 // 30 seconds max for processing lock
  ) {}

  async execute<TResponse>(params: {
    key: string;
    method: string;
    path: string;
    body?: unknown;
    tenantId?: string;
    handler: () => Promise<{ statusCode: number; body: TResponse }>;
  }): Promise<{ isReplay: boolean; statusCode: number; body: TResponse }> {
    const { key, method, path, body, tenantId, handler } = params;
    const requestHash = computeRequestHash({ method, path, body, tenantId });

    // 1. Synchronous check for in-flight requests to eliminate race conditions
    const currentFlight = this.inFlight.get(key);
    if (currentFlight) {
      if (currentFlight.hash !== requestHash) {
        throw new ConflictError(
          `Idempotency-Key '${key}' is already in use with a different request payload.`
        );
      }
      const res = await currentFlight.promise;
      return { isReplay: true, statusCode: res.statusCode, body: res.body };
    }

    let resolveInFlight!: (val: any) => void;
    let rejectInFlight!: (err: any) => void;
    const inFlightPromise = new Promise<{ isReplay: boolean; statusCode: number; body: TResponse }>(
      (resolve, reject) => {
        resolveInFlight = resolve;
        rejectInFlight = reject;
      }
    );
    inFlightPromise.catch(() => {}); // Prevent unhandled rejection warning if no concurrent waiters

    this.inFlight.set(key, { hash: requestHash, promise: inFlightPromise });

    try {
      const existing = await this.store.get(key);

      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw new ConflictError(
            `Idempotency-Key '${key}' is already in use with a different request payload.`
          );
        }

        if (existing.status === "COMPLETED") {
          const replayRes = {
            isReplay: true,
            statusCode: existing.statusCode || 200,
            body: existing.responseBody as TResponse,
          };
          resolveInFlight(replayRes);
          return replayRes;
        }

        if (existing.status === "PROCESSING") {
          const isLockStale = Date.now() - existing.createdAt > this.lockTimeoutMs;
          if (!isLockStale) {
            throw new ConflictError(
              `A request with Idempotency-Key '${key}' is currently being processed. Please retry shortly.`
            );
          }
          logger.warn(`Idempotency lock for key '${key}' expired after ${this.lockTimeoutMs}ms. Recovering lock.`);
        }
      }

      // Mark as PROCESSING
      const record: IdempotencyRecord = {
        key,
        requestHash,
        tenantId,
        status: "PROCESSING",
        createdAt: Date.now(),
        expiresAt: Date.now() + this.defaultTtlMs,
      };
      await this.store.set(record);

      const result = await handler();

      await this.store.update(key, {
        status: "COMPLETED",
        statusCode: result.statusCode,
        responseBody: result.body,
      });

      const finalRes = {
        isReplay: false,
        statusCode: result.statusCode,
        body: result.body,
      };
      resolveInFlight(finalRes);
      return finalRes;
    } catch (err) {
      rejectInFlight(err);
      await this.store.update(key, {
        status: "FAILED",
      });
      throw err;
    } finally {
      this.inFlight.delete(key);
    }
  }
}

export const defaultIdempotencyManager = new IdempotencyManager();
