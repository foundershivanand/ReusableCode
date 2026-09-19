# Deployment: Multi-Language & i18n

## Database Setup
Run the migration script:
```bash
psql $DATABASE_URL -f server/migrations/001_initial_i18n_schema.sql
```

## Translation File Sync
Sync translation JSON files from version control or TMS (Translation Management System) into `i18n_dictionaries` during CI/CD build steps.
