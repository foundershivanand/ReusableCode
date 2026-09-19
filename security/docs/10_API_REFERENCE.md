# 10 — Security API Reference

## 1. SecurityService Methods
- `checkRateLimit(identifier: string, scope: RateLimitScope, customConfig?: Partial<RateLimitConfig>): Promise<RateLimitResult>`
- `isClientBlocked(ip: string): Promise<boolean>`

## 2. Utility Functions
- `validateSafeExternalUrl(rawUrl: string): URL` (SSRF protection)
- `isPrivateOrReservedIp(ip: string): boolean`
- `normalizeRequest(method, rawPath, headers, clientIp): NormalizedRequest`
- `getSecurityHeaders(): SecurityHeaders`
- `normalizeErrorResponse(err: unknown, requestId?: string): { error: string; code: string; requestId?: string }`

## 3. Client SDK & Hooks
- `useRateLimitModal()`: `{ isOpen, retryAfterSeconds, trigger, close }`
- `useSecurity()`: Full security context
