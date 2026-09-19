# 05 — Settings Deployment & Database Migrations

1. **Migration Steps**:
   - Execute `001_initial_settings_schema.sql` to initialize `user_settings` and `organization_settings`.
2. **On-the-Fly vs Batch Migrations**:
   - Read-time migration: `getUserSettings()` migrates records on read.
   - Optional background job: Run a worker script to migrate all legacy rows in batches during off-peak hours.
