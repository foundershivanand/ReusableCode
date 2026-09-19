# Module 01: Performance, Scalability & Caching

## 1. Benchmarking & Latency Targets

- **Session Validation**: < 2ms (In-memory / Redis cache); < 10ms (Indexed DB query).
- **Password Hashing (scrypt)**: Configured to ~100ms on server CPUs (balancing brute-force resistance with CPU overhead).
- **TOTP Verification**: < 1ms.
- **Token Verification**: < 3ms.

---

## 2. Database Indexing Strategy

For production SQL databases (PostgreSQL, SQLite, MySQL), the following indexes are strictly required:

```sql
-- Fast email lookups for authentication
CREATE UNIQUE INDEX idx_users_email ON users(LOWER(email));

-- Fast session token resolution & expiration sweeps
CREATE UNIQUE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Verification tokens lookup
CREATE UNIQUE INDEX idx_verification_tokens_hash ON verification_tokens(token_hash);
CREATE INDEX idx_verification_tokens_user_purpose ON verification_tokens(user_id, purpose);

-- OAuth accounts lookup
CREATE UNIQUE INDEX idx_oauth_provider_user ON oauth_accounts(provider, provider_user_id);
CREATE INDEX idx_oauth_user_id ON oauth_accounts(user_id);

-- MFA recovery codes lookup
CREATE INDEX idx_mfa_recovery_codes_user ON mfa_recovery_codes(user_id);

-- Audit log filtering
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id, timestamp);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, timestamp);
```

---

## 3. Caching & Session Invalidation

- **Session Caching**: Active sessions can be cached in Redis using key `session:{tokenHash}` with a TTL equal to the inactivity timeout (30 minutes).
- **Global Invalidation**: Because sessions carry `sessionVersion`, a single increment to `user.sessionVersion` invalidates all cached sessions on next access without requiring atomic Redis wildcard deletions.
