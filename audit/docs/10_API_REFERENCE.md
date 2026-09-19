# 10 — Audit Logs API Reference

### `POST /api/audit/log`
Appends an audit entry with secret scrubbing and hash calculation.

### `POST /api/audit/query`
Queries audit logs with filtering and pagination.

### `GET /api/audit/verify?tenantId=:tenantId`
Validates the cryptographic hash chain for a given tenant.
