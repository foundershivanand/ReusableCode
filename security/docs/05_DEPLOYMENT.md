# 05 — Security Deployment & Proxy Headers

1. **Trusted Reverse Proxy Configuration**:
   - In production behind Cloudflare or AWS ALB, ensure client IP extraction uses trusted proxy headers:
     `CF-Connecting-IP` or the first untrusted IP in `X-Forwarded-For`.
   - Never trust raw client-provided `X-Forwarded-For` without validating upstream proxy hops.
2. **Database Migration**:
   - Apply `001_initial_security_schema.sql` to initialize `blocked_ips` and `security_events`.
