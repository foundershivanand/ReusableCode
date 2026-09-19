# Deployment: Changelog, Roadmap & What's New

## Migration
Execute the schema migration:
```bash
psql $DATABASE_URL -f server/migrations/001_initial_changelog_schema.sql
```

## Scheduled Publishing Cron
Configure a background cron worker to periodically publish items whose `scheduled_for <= NOW()` and `status = 'SCHEDULED'`.
