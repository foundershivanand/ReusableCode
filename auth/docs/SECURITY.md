# Module 01: Security Summary & Threat Model

## 1. Executive Summary

This authentication module is engineered to provide defensible, production-grade security for independent SaaS products. It incorporates defense-in-depth across input validation, storage, authentication, authorization, and transport.

---

## 2. Threat Mitigations

| Threat Vector | Mitigation Strategy | Verification Test |
|---|---|---|
| **Account Enumeration** | Constant-time dummy scrypt hashing on user miss; uniform success messages for password reset, magic links, and verification. | `security-audit-25.test.ts #21`, `password-reset.test.ts` |
| **Credential Stuffing / Brute Force** | Dual-layer sliding-window rate limiting (IP + Account email) and account lockout with exponential backoff after 3-5 failed attempts. | `security-audit-25.test.ts #15`, `rate-limiting.test.ts` |
| **Session Fixation** | Complete session rotation on authentication; new session token generated and old token atomically revoked. | `session-lifecycle.test.ts` |
| **Session Hijacking** | `__Host-` prefixed cookies with `HttpOnly`, `Secure`, `SameSite=Lax`, narrowly scoped path `/`, and inactivity timeouts. | `cookie-manager.ts`, `session-service.ts` |
| **CSRF** | Double-submit cookie verification with `x-csrf-token` header and timing-safe comparison on state-changing methods. | `csrf.test.ts` |
| **MFA Code Replay** | Tracks `mfaLastUsedStep`; rejects any reused TOTP code within the ±1 step drift window. | `mfa.test.ts` |
| **OAuth Account Takeover** | Rejects unverified email linking; validates exact redirect URIs against allowlist; enforces PKCE (S256) and single-use state tokens. | `oauth.test.ts` |
| **Privilege Escalation** | Server-side authorization pipeline; users cannot alter their own `role` or `permissions`. | `security-audit-25.test.ts #18`, `authorization.test.ts` |
| **IDOR** | Authoritative user ID derived from session record; strict resource ownership verification (`canAccess`). | `security-audit-25.test.ts #17`, `authorization.test.ts` |
| **Sensitive Data Leakage** | `PublicUserSchema` filters internal fields; `AuditLogger` automatically redacts passwords, tokens, secrets, and auth headers. | `security-audit-25.test.ts #20`, `audit-logger.ts` |
| **Password Breach & Reuse** | Pluggable `PasswordBreachChecker` and password history comparison against the last 5 password hashes. | `signup.test.ts`, `password-reset.test.ts` |

---

## 3. Cryptographic Standards

- **Password Hashing**: `scrypt` with parameters `N=32768, r=8, p=1, keyLength=64`. Transparent rehashing is triggered whenever parameters or algorithms are upgraded.
- **Session & Verification Tokens**: 256-bit cryptographically secure random bytes (`crypto.randomBytes(32)`), stored as SHA-256 hashes.
- **Two-Factor Authentication**: RFC 6238 TOTP (HMAC-SHA1/SHA256, 30-second window, ±1 drift allowance, replay prevention).
- **MFA Recovery Codes**: 10 cryptographically secure 10-character alphanumeric codes, stored hashed via SHA-256, single-use only.
- **Constant-Time Operations**: All token, password, and CSRF comparisons utilize `crypto.timingSafeEqual` to eliminate timing side-channels.
