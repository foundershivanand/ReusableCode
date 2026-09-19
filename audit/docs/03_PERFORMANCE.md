# 03 — Audit Logs Performance & Indexing

## 1. High-Throughput Ingestion
- Audit writes are append-only; database indexes on `(tenant_id, timestamp DESC)` allow fast cursor-based pagination.
- Audit ingestion can optionally be buffered via a Redis or BullMQ queue to decouple user request latency from audit persistence.
