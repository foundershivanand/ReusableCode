# 03 — Settings Performance & Storage

## 1. Structured JSONB Storage
Settings are stored in PostgreSQL as `JSONB` columns with schema validation enforced at the application boundary via Zod. This allows rapid schema evolution without expensive `ALTER TABLE` locks across millions of rows.

## 2. Caching Resolved Preferences
Resolved preferences (`theme`, `locale`, `timezone`, `privacy`) should be cached at the session or edge layer (e.g. JWT payload, Redis `user:{userId}:preferences`, or HTTP cookies) to eliminate database queries on high-traffic page loads.
