import { describe, expect, it } from "vitest";
import { RateLimiter } from "../server/rate-limiter.js";
import { RateLimitMiddleware } from "../middleware/rate-limit-middleware.js";

describe("Rate Limiting & Abuse Detection", () => {
  it("enforces sliding window limits and returns Retry-After headers", async () => {
    const rateLimiter = new RateLimiter();
    rateLimiter.setConfig("test_action", { windowMs: 10000, maxRequests: 2 });
    const middleware = new RateLimitMiddleware(rateLimiter);

    const req = { ip: "192.168.1.100" };

    // Request 1: allowed
    const res1 = await middleware.handle(req, { action: "test_action" });
    expect(res1.allowed).toBe(true);
    expect(res1.headers["RateLimit-Remaining"]).toBe("1");

    // Request 2: allowed
    const res2 = await middleware.handle(req, { action: "test_action" });
    expect(res2.allowed).toBe(true);
    expect(res2.headers["RateLimit-Remaining"]).toBe("0");

    // Request 3: blocked with 429
    const res3 = await middleware.handle(req, { action: "test_action" });
    expect(res3.allowed).toBe(false);
    expect(res3.status).toBe(429);
    expect(res3.headers["Retry-After"]).toBeDefined();
    expect(res3.error?.code).toBe("TOO_MANY_REQUESTS");
  });

  it("enforces dual-layer rate limiting across both IP and account email", async () => {
    const rateLimiter = new RateLimiter();
    rateLimiter.setConfig("login:account", { windowMs: 10000, maxRequests: 2 });
    rateLimiter.setConfig("login:ip", { windowMs: 10000, maxRequests: 10 });

    // Same account from different IPs
    const r1 = await rateLimiter.checkDualRateLimit("login", "1.1.1.1", "victim@example.com");
    expect(r1.allowed).toBe(true);

    const r2 = await rateLimiter.checkDualRateLimit("login", "2.2.2.2", "victim@example.com");
    expect(r2.allowed).toBe(true);

    // 3rd attempt on same account blocked even from 3rd IP
    const r3 = await rateLimiter.checkDualRateLimit("login", "3.3.3.3", "victim@example.com");
    expect(r3.allowed).toBe(false);
  });
});
