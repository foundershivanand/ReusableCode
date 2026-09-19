# Module 01: Database Backup, Restore & Disaster Recovery Checklist

## 1. Objectives & Metrics
- **Recovery Point Objective (RPO)**: Maximum acceptable data loss = < 15 minutes.
- **Recovery Time Objective (RTO)**: Maximum acceptable downtime to restore = < 30 minutes.

---

## 2. Backup Strategy

1. **Continuous WAL Archiving / Point-in-Time Recovery (PITR)**:
   - Enable write-ahead log (WAL) archiving for PostgreSQL.
   - Retain 7-30 days of continuous PITR capability.

2. **Daily Encrypted Snapshot**:
   - Automated full database dump daily at 02:00 UTC.
   - Encrypted with AES-256 before uploading to isolated S3/Cloudflare R2 storage.
   - Separate access credentials from application servers.

---

## 3. Restore Verification Drill Checklist

> [!IMPORTANT]
> A backup is NOT reliable until it has been tested and verified via a restore drill.

- [ ] **Automated Monthly Restore Test**: Spin up an isolated staging database and restore the latest snapshot.
- [ ] **Data Integrity Smoke Test**:
  - Run row count verification across `users`, `sessions`, `oauth_accounts`.
  - Validate foreign key constraints integrity.
  - Verify that a known test user's password and session can be successfully authenticated.
- [ ] **Documented Runbook**: Maintain step-by-step restoration commands and access credentials in an offline secure vault.
