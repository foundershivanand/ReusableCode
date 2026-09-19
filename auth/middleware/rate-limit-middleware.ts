import { RateLimiter, RateLimitResult } from "../server/rate-limiter.js";

export interface RateLimitMiddlewareOptions {
  action: string;
  getIdentifier?: (req: { ip?: string; headers?: Record<string, any>; body?: any }) => string;
}

export class RateLimitMiddleware {
  private rateLimiter: RateLimiter;

  constructor(rateLimiter: RateLimiter) {
    this.rateLimiter = rateLimiter;
  }

  async handle(
    req: { ip?: string; headers?: Record<string, any>; body?: any },
    options: RateLimitMiddlewareOptions
  ): Promise<{
    allowed: boolean;
    status: number;
    headers: Record<string, string>;
    error?: { code: string; message: string; retryAfterSeconds: number };
  }> {
    const ip = req.ip || (req.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1";
    const accountIdentifier = options.getIdentifier ? options.getIdentifier(req) : undefined;

    const result: RateLimitResult = await this.rateLimiter.checkDualRateLimit(
      options.action,
      ip,
      accountIdentifier
    );

    const headers: Record<string, string> = {
      "RateLimit-Limit": result.limit.toString(),
      "RateLimit-Remaining": result.remaining.toString(),
      "RateLimit-Reset": Math.ceil(result.resetTimeMs / 1000).toString(),
    };

    if (!result.allowed) {
      headers["Retry-After"] = result.retryAfterSeconds.toString();
      return {
        allowed: false,
        status: 429,
        headers,
        error: {
          code: "TOO_MANY_REQUESTS",
          message: `Too many requests. Please try again in ${result.retryAfterSeconds} seconds.`,
          retryAfterSeconds: result.retryAfterSeconds,
        },
      };
    }

    return {
      allowed: true,
      status: 200,
      headers,
    };
  }
}
