# 03 — Search Performance & Index Versioning

## 1. Full-Text Search Vector
- PostgreSQL `tsvector` with GIN indexing delivers sub-10ms search query response times.
- Search indexing jobs run asynchronously during high-volume document batch updates.
