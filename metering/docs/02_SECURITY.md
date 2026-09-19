# Security: Metering & Credit System

## Concurrency & Double-Spending Protection
- Concurrent balance updates are guarded against race conditions using per-tenant mutexes in application memory and database optimistic concurrency control (`version` check).
- Two simultaneous requests cannot both pass `remaining >= cost` using stale balances.

## Input Validation & Rate Limiting
- Ingested events are strictly validated with Zod schemas.
- Quantities and amounts must be positive numbers.
- Idempotency keys prevent replay attacks and duplicate debits.

## Admin Controls & Audit Trail
- Admin balance adjustments require authenticated administrator privileges (`adminUserId`).
- Every adjustment generates an immutable ledger entry with an audited reason.
- Balances are never modified directly without a ledger record.
