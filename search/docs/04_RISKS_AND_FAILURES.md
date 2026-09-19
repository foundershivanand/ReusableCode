# 04 — Search Risks and Failure Modes

## 1. Consistency & Index Drift
- When a document is modified or deleted in PostgreSQL, the search index updates synchronously within the transaction or via an outbox event.
