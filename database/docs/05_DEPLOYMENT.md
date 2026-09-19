# Deployment: Database Migration, Backup & Disaster Recovery

## Schema Migration
```bash
psql $DATABASE_URL -f server/migrations/001_initial_database_schema.sql
```

## CLI Commands
- `pnpm run db:migrate`: Run pending migrations with safety checks.
- `pnpm run db:rollback`: Rollback last applied migration.
- `pnpm run db:backup`: Trigger full snapshot and WAL upload.
- `pnpm run db:verify`: Execute restore drill and check invariants.
