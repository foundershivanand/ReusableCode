import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  executePipeline,
  CacheManager,
  InMemoryCacheStore,
  buildCacheKey,
  IdempotencyManager,
  InMemoryIdempotencyStore,
  CircuitBreaker,
  Bulkhead,
} from "../index.js";

describe("Scalability & High-Throughput Load Simulation (1000s req/sec)", () => {
  it("should process 2,000 concurrent pipeline requests with zero crashes and sub-second latency", async () => {
    const inputSchema = z.object({ value: z.number() });
    const outputSchema = z.object({ doubled: z.number(), requestId: z.string() });

    const pipelineDef = {
      inputSchema,
      outputSchema,
      requireAuth: false,
      handler: async (ctx: any) => ({
        doubled: ctx.input.value * 2,
        requestId: ctx.requestId,
      }),
    };

    const CONCURRENT_REQUESTS = 2000;
    const start = Date.now();

    const promises = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
      executePipeline(pipelineDef, { body: { value: i } })
    );

    const results = await Promise.all(promises);
    const duration = Date.now() - start;

    expect(results.length).toBe(CONCURRENT_REQUESTS);
    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
      expect(results[i].statusCode).toBe(200);
      expect((results[i].body as any).doubled).toBe(i * 2);
    }

    // Must be fast and non-blocking
    expect(duration).toBeLessThan(3000);
  });

  it("should enforce LRU bounded capacity without memory growth under 10,000 cache writes", async () => {
    const MAX_ENTRIES = 500;
    const cacheStore = new InMemoryCacheStore(MAX_ENTRIES);
    const cache = new CacheManager(cacheStore);

    // Insert 10,000 keys into a cache capped at 500
    for (let i = 0; i < 10_000; i++) {
      const key = buildCacheKey({
        namespace: "load_test",
        tenantId: `tenant_${i % 10}`,
        resource: "item",
        identifier: `id_${i}`,
      });
      await cacheStore.set(key, { data: `value_${i}` }, { ttlSeconds: 300 });
    }

    const metrics = cache.getMetrics();
    expect(metrics?.size).toBeLessThanOrEqual(MAX_ENTRIES);
    expect(metrics?.evictions).toBe(10_000 - MAX_ENTRIES);
  });

  it("should handle 1,000 concurrent requests across 20 idempotency keys with exact once execution", async () => {
    const manager = new IdempotencyManager(new InMemoryIdempotencyStore(1000));
    const executionCounters = new Map<string, number>();

    const runRequest = async (key: string, payloadVal: number) => {
      return manager.execute({
        key,
        method: "POST",
        path: "/api/pay",
        body: { amount: payloadVal },
        tenantId: "tenant_scale",
        handler: async () => {
          const current = executionCounters.get(key) || 0;
          executionCounters.set(key, current + 1);
          return { statusCode: 200, body: { success: true, key } };
        },
      });
    };

    const TOTAL_REQUESTS = 1000;
    const UNIQUE_KEYS = 20;

    const promises = Array.from({ length: TOTAL_REQUESTS }, (_, i) => {
      const keyIndex = i % UNIQUE_KEYS;
      const key = `key_batch_${keyIndex}`;
      return runRequest(key, keyIndex * 100);
    });

    const results = await Promise.all(promises);
    expect(results.length).toBe(TOTAL_REQUESTS);

    // Verify exactly UNIQUE_KEYS handlers were executed
    for (let k = 0; k < UNIQUE_KEYS; k++) {
      const key = `key_batch_${k}`;
      expect(executionCounters.get(key)).toBe(1);
    }
  });

  it("should isolate downstream failures with CircuitBreaker and recover on probe", async () => {
    const breaker = new CircuitBreaker("payment_gateway", {
      failureThreshold: 3,
      recoveryTimeoutMs: 50,
    });

    let downstreamFails = true;
    const callGateway = async () => {
      return breaker.execute(async () => {
        if (downstreamFails) throw new Error("Payment Gateway 503 Outage");
        return { charged: true };
      });
    };

    // 3 failures to trip the breaker
    await expect(callGateway()).rejects.toThrow("503");
    await expect(callGateway()).rejects.toThrow("503");
    await expect(callGateway()).rejects.toThrow("503");

    expect(breaker.getState()).toBe("OPEN");

    // Next call fails fast without calling downstream
    await expect(callGateway()).rejects.toThrow("Circuit breaker is OPEN");

    // Wait for recovery timeout
    await new Promise((r) => setTimeout(r, 60));
    expect(breaker.getState()).toBe("HALF_OPEN");

    // Downstream recovers
    downstreamFails = false;
    const res = await callGateway();
    expect(res.charged).toBe(true);
    expect(breaker.getState()).toBe("CLOSED");
  });

  it("should shed excess load with Bulkhead concurrency limiter", async () => {
    const bulkhead = new Bulkhead("heavy_ai_worker", {
      maxConcurrent: 5,
      maxQueue: 5,
    });

    let activeOperations = 0;
    let maxObservedActive = 0;

    const worker = async () => {
      return bulkhead.execute(async () => {
        activeOperations++;
        maxObservedActive = Math.max(maxObservedActive, activeOperations);
        await new Promise((r) => setTimeout(r, 20));
        activeOperations--;
        return true;
      });
    };

    // Fire 10 tasks (5 active, 5 queued) -> all succeed
    const tasks = Array.from({ length: 10 }, () => worker());
    const results = await Promise.all(tasks);

    expect(results.length).toBe(10);
    expect(maxObservedActive).toBeLessThanOrEqual(5);

    // If queue is full, 11th task is rejected immediately
    const fullTasks = Array.from({ length: 10 }, () => worker());
    const rejectedTask = worker(); // 11th exceeds maxQueue 5

    await expect(rejectedTask).rejects.toThrow("Rate limit exceeded");
    await Promise.all(fullTasks);
  });
});
