# Deployment: Experimentation & A/B Testing

## Database Migration
Execute the schema migration:
```bash
psql $DATABASE_URL -f server/migrations/001_initial_experimentation_schema.sql
```

## Production Verification
- Verify that table `experiment_definitions` and `experiment_assignments` are indexed by `user_id`.
