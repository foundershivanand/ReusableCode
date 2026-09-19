# Architecture: Database Migration, Backup & Disaster Recovery

## Overview
The Database Reliability module manages schema version tracking, destructive migration protection, advisory migration locking, point-in-time recovery (PITR), backup encryption, and automated restore verification drills.

## Core Capabilities
1. **Destructive Migration Protection**:
   - Automated AST / regex parsing rejects accidental `DROP TABLE`, `DROP COLUMN`, or `TRUNCATE` operations in production without explicit manual override.
2. **Advisory Migration Locking**:
   - Prevents race conditions and schema corruption from multiple containers attempting migrations simultaneously (`pg_advisory_lock`).
3. **Point-In-Time Recovery (PITR)**:
   - Full snapshots combined with continuous Write-Ahead Log (WAL) archiving allow database restoration to any specific second.
4. **Restore Verification Drills**:
   - A backup is not considered reliable simply because it was generated. Scheduled restore drills restore snapshots to isolated targets and test row count consistency, foreign key constraints, and critical schema invariants.
5. **RPO & RTO Objectives**:
   - RPO (Recovery Point Objective): $\le 60$ minutes.
   - RTO (Recovery Time Objective): $\le 120$ minutes.
