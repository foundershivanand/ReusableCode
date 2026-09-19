# Performance: Metering & Credit System

## Indexing & Query Optimization
- Index on `(tenant_id, priority ASC, expires_at ASC)` allows $O(\log N)$ lookup of active credit grants.
- Index on `(tenant_id, created_at DESC)` ensures efficient pagination of the ledger without table scans.
- Reservation lookup by UUID and composite index `(tenant_id, status)` optimizes active reservation checks.

## Ingestion Throughput
- Metering events can be ingested synchronously or buffered via a message queue/batch collector.
- Idempotency checks rely on unique constraints backed by B-tree indexes.
