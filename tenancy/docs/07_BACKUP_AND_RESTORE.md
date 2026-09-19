# 07 — Multi-Tenancy Backup & Recovery

1. **Per-Tenant Export**:
   - `pg_dump` query-filtered by `organization_id`:
     `COPY (SELECT * FROM workspaces WHERE organization_id = 'org_xxx') TO STDOUT;`
2. **Disaster Recovery**:
   - In case of catastrophic tenant deletion, records in `PENDING_DELETION` can be immediately reinstated by clearing `deleted_at` and setting `status = 'ACTIVE'` within the 30-day grace window.
