# Deployment: Metering & Credit System

## Database Migrations
Run the initial schema migration:
```bash
psql $DATABASE_URL -f server/migrations/001_initial_metering_schema.sql
```

## Production Verification
- Run test suite: `vitest run metering/tests/metering.test.ts`
- Ensure database connections use transaction isolation level `READ COMMITTED` or `SERIALIZABLE` depending on scale.
- Configure cron for reservation timeout cleanup and credit expiration.
