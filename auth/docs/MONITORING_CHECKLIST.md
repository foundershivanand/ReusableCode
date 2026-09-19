# Module 01: Monitoring, Observability & Incident Response Checklist

## 1. Key Metrics & Alert Thresholds

| Metric | Target / Normal | Warning Alert | Critical Pager Alert |
|---|---|---|---|
| **Failed Login Rate** | < 2% of total logins | > 5% over 5m window | > 15% over 5m window (potential credential stuffing) |
| **Rate Limit 429 Responses** | < 0.5% | > 2% over 5m window | > 10% over 5m window |
| **Session Validation Latency (p99)** | < 10ms | > 25ms | > 100ms |
| **Password Hash Computation (p95)** | ~100ms | > 300ms | > 1000ms (CPU starvation) |
| **Account Lockout Events** | < 1 per hour | > 10 per hour | > 50 per hour |
| **MFA Verification Failure Rate** | < 3% | > 10% | > 25% |

---

## 2. Synthetic Monitoring Checks

- **Synthetic User Login Drill**: Run an automated end-to-end synthetic check every 5 minutes executing:
  1. Signup test account (or use dedicated synthetic user)
  2. Authenticate with credentials
  3. Validate session cookie
  4. Perform clean logout
- Trigger alert if synthetic login drill fails 2 consecutive times.

---

## 3. Incident Response Runbooks

- **Brute Force / Stuffing Incident**:
  1. Inspect `audit_logs` for concentrated IP blocks or target usernames.
  2. Apply temporary IP CIDR block at WAF / Cloudflare level.
  3. Force global session invalidation (`sessionVersion++`) on affected accounts.
  4. Trigger mandatory password reset on targeted accounts.
