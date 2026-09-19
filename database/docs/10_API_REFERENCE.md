# API Reference: Database Migration, Backup & Disaster Recovery

## REST Endpoints

### GET `/api/database/migrations`
Returns applied schema migrations (`MigrationRecord[]`).

### GET `/api/database/backups`
Returns backup snapshot records (`BackupRecord[]`).

### POST `/api/database/backups`
Triggers an immediate encrypted backup snapshot.

### POST `/api/database/backups/:id/verify-restore`
Executes an automated restore verification drill.
- Returns: `{ success: boolean, durationMs: number }`

### GET `/api/database/dr-config`
Returns current disaster recovery parameters (`DisasterRecoveryConfig`).
