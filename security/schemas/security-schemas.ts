import { z } from "zod";

export const RateLimitAlgorithmSchema = z.enum(["SLIDING_WINDOW", "TOKEN_BUCKET", "FIXED_WINDOW"]);
export type RateLimitAlgorithm = z.infer<typeof RateLimitAlgorithmSchema>;

export const RateLimitScopeSchema = z.enum([
  "LOGIN",
  "SIGNUP",
  "PASSWORD_RESET",
  "API_DEFAULT",
  "AI_GENERATE",
  "FILE_UPLOAD",
  "WEBHOOK_INGEST"
]);
export type RateLimitScope = z.infer<typeof RateLimitScopeSchema>;

export const RateLimitConfigSchema = z.object({
  scope: RateLimitScopeSchema,
  algorithm: RateLimitAlgorithmSchema.default("SLIDING_WINDOW"),
  maxRequests: z.number().int().min(1),
  windowSeconds: z.number().int().min(1),
  blockDurationSeconds: z.number().int().min(0).default(0) // 0 = no extended penalty
});
export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;

export const RateLimitResultSchema = z.object({
  allowed: z.boolean(),
  remaining: z.number().int().min(0),
  limit: z.number().int().min(1),
  resetAt: z.date(),
  retryAfterSeconds: z.number().int().min(0)
});
export type RateLimitResult = z.infer<typeof RateLimitResultSchema>;

export const SecurityHeadersSchema = z.object({
  contentSecurityPolicy: z.string(),
  strictTransportSecurity: z.string(),
  xContentTypeOptions: z.string().default("nosniff"),
  xFrameOptions: z.string().default("DENY"),
  referrerPolicy: z.string().default("strict-origin-when-cross-origin"),
  permissionsPolicy: z.string()
});
export type SecurityHeaders = z.infer<typeof SecurityHeadersSchema>;

export const NormalizedRequestSchema = z.object({
  method: z.string(),
  normalizedPath: z.string(),
  normalizedHeaders: z.record(z.string(), z.string()),
  clientIp: z.string(),
  timestamp: z.date()
});
export type NormalizedRequest = z.infer<typeof NormalizedRequestSchema>;
