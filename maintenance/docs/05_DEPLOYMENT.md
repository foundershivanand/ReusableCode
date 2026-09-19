# Deployment: Maintenance Mode, Status & System Banners

## Migration
Execute the schema migration:
```bash
psql $DATABASE_URL -f server/migrations/001_initial_maintenance_schema.sql
```

## Pre-Deployment Maintenance Script
```bash
# Set maintenance mode before running destructive migrations
curl -X POST https://api.yourapp.com/api/maintenance/config \
  -H "Authorization: Bearer $DEPLOY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "READ_ONLY", "title": "Deploying update", "message": "Database migrations in progress."}'
```
