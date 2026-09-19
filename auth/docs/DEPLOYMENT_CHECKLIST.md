# Module 01: Production Deployment Checklist

Before deploying this module to production, complete each checklist item:

## 1. Network & Transport Security
- [ ] **Enforce HTTPS**: Verify that all traffic is redirected from HTTP to HTTPS with HSTS enabled (`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`).
- [ ] **Reverse Proxy Configuration**: Ensure reverse proxies (Nginx, Cloudflare, AWS ALB) forward client IPs via `X-Forwarded-For` and trust only known proxy CIDRs.
- [ ] **Cookie Domain & Scope**: Ensure session cookies use the `__Host-` prefix in production (requires HTTPS, `Path=/`, and no `Domain` attribute).

## 2. Secrets & Environment Variables
- [ ] **Cryptographic Randomness**: Verify all secrets (`SESSION_SECRET`, `CSRF_SECRET`, OAuth client secrets) are generated using 32+ bytes of high-entropy randomness.
- [ ] **No Secrets in Source Code**: Ensure `.env` and `.env.production` files are excluded in `.gitignore`.
- [ ] **OAuth Redirect Allowlist**: Ensure only exact production callback URLs are registered with Google, GitHub, and Apple developer consoles (no wildcard URLs or localhost).

## 3. Database & Storage
- [ ] **Indexes Applied**: Run database migration applying all unique and foreign key indexes (see [PERFORMANCE.md](file:///home/shiva/reusable/auth/docs/PERFORMANCE.md)).
- [ ] **Encrypted Backups**: Ensure database backups are encrypted and automated.
- [ ] **Connection Pooling**: Configure database connection pooling with health checks and timeout limits.

## 4. Rate Limiting & Abuse Protection
- [ ] **Persistent Rate Limiter**: For multi-instance/serverless deployments, configure Redis/Upstash adapter for `RateLimiter` store.
- [ ] **Alert Thresholds**: Configure alerts for spikes in 429 Too Many Requests or failed login spikes.
