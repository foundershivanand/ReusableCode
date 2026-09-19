# 07 — Analytics Backup & Data Retention

1. **Retention Policies**:
   - `application_logs`: Retain in PostgreSQL for 30–90 days, then archive to cold storage (e.g. S3 compressed JSON/Parquet) or truncate.
   - `analytics_events`: Retain for 12 months in database; stream to data warehouse (ClickHouse / BigQuery / Snowflake) for multi-year analytics.
