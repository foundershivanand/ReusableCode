# 07 — Notification Backup & Retention

1. **Suppression List Backup**:
   - `notification_suppressions` must be backed up daily and never casually truncated; lost suppressions lead to immediate IP blacklisting upon re-sending to bad addresses.
2. **Log Retention**:
   - `notifications` records older than 90 days should be archived to cold storage (e.g. S3 Parquet / BigQuery) or pruned to prevent unbounded database growth.
