# 07 — File Storage Backup & Disaster Recovery

1. **Cross-Region Replication**:
   - Enable S3 / R2 cross-region bucket replication to protect against regional data center outages.
2. **Database & Storage Synchronization**:
   - Point-in-time recovery (PITR) for PostgreSQL must align with bucket object versioning. If restoring DB to an earlier point, versioned S3 objects ensure matching historical keys exist.
