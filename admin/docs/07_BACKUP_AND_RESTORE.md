# 07 — Admin Backup & Audit Log Retention

1. **Immutable Audit Logs**:
   - `admin_audit_logs` must be treated as append-only. The application database user should have `SELECT` and `INSERT` permissions on this table, but `UPDATE` and `DELETE` revoked.
2. **Compliance Archiving**:
   - Audit logs should be mirrored to an append-only S3 bucket with Object Lock (WORM - Write Once, Read Many) for compliance auditing (SOC 2, ISO 27001).
