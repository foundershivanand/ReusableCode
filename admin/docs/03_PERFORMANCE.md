# 03 — Admin Performance & Query Safeguards

## 1. Dangerous Query Protection
Admin search and filter endpoints are vulnerable to denial-of-service if arbitrary table scans are allowed:
- Strict pagination limits: default page size is 50; hard cap is 100 records per request.
- Compound indexing on `(target_type, target_id)` and `(timestamp DESC)` ensures audit searches execute in < 5ms.

## 2. Bounded Bulk Operations
Bulk actions (e.g. mass suspending spam accounts) are capped at 100 items per request. Operations process sequentially or in small parallel batches with per-item error isolation to prevent partial failures from locking the entire database table.
