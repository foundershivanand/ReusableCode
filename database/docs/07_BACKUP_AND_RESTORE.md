# Backup & Disaster Recovery Runbook

## Disaster Recovery Objectives
- **RPO (Recovery Point Objective)**: 60 minutes (maximum data loss window).
- **RTO (Recovery Time Objective)**: 120 minutes (maximum downtime to fully restore service).
- **Retention**: 30 days of daily full snapshots + 7 days of continuous WAL archiving.
- **Owner**: Database Reliability Engineering (`dbe-team@company.internal`).
- **Dependencies**: AWS S3 WORM Bucket, KMS Encryption Keys, Standby Compute VPC.

## Point-In-Time Recovery (PITR) Procedure
1. **Identify Target Timestamp**:
   - Determine exact UTC timestamp before the data corruption event: e.g. `2026-09-19T14:32:00Z`.
2. **Provision Standby Target**:
   - Launch an isolated PostgreSQL instance in recovery VPC.
3. **Restore Base Snapshot**:
   - Download the latest base snapshot prior to target timestamp:
     ```bash
     aws s3 cp s3://prod-backups-immutable-worm/base_snapshot_20260919.enc ./
     openssl enc -d -aes-256-cbc -in base_snapshot_20260919.enc -out base.tar -k $DATABASE_BACKUP_ENCRYPTION_KEY
     tar -xf base.tar -C /var/lib/postgresql/data
     ```
4. **Replay WAL Archives**:
   - Configure `recovery.signal` and `postgresql.conf`:
     ```ini
     restore_command = 'aws s3 cp s3://prod-backups-immutable-worm/wal/%f %p'
     recovery_target_time = '2026-09-19 14:32:00 UTC'
     recovery_target_action = 'promote'
     ```
   - Start PostgreSQL service.
5. **Verification & Invariant Checks**:
   - Verify table row counts and referential integrity:
     ```sql
     SELECT count(*) FROM users;
     SELECT count(*) FROM billing_subscriptions;
     ```
6. **Switch Ingress / DNS**:
   - Update `DATABASE_URL` in application environment and restart web pods.
