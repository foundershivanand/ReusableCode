# Monitoring & Alerts: Database Migration, Backup & Disaster Recovery

## Metrics
- `database.backup_age_seconds`: Age of most recent successful backup.
- `database.backup_size_bytes`: Size in bytes of generated backup snapshots.
- `database.restore_drill_duration_seconds`: Duration of automated restore test drills.

## Alerts
- `BackupStaleAlert`: Triggered when latest backup is older than 60 minutes (RPO breach).
- `RestoreDrillFailedAlert`: Triggered when an automated restore verification drill fails.
- `BackupSizeAnomalyAlert`: Triggered when backup size deviates by more than 30% from 7-day average.
