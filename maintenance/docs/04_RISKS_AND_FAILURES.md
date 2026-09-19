# Risks & Failures: Maintenance Mode, Status & System Banners

## Failure Modes & Mitigations
1. **Admin Lockout**: Administrator turns on full maintenance mode and accidentally locks out all access, including admin console.
   - *Mitigation*: Hardcoded environment variable emergency bypass secret (`MAINTENANCE_ADMIN_BYPASS_SECRET`) that bypasses database checks entirely.
2. **Background Worker Corruption**: System is put into maintenance, but asynchronous queue workers continue processing mutations against half-migrated database schemas.
   - *Mitigation*: Background workers check `checkMaintenance({ path: "worker", method: "POST" })` before dequeueing tasks, pausing execution during maintenance.
3. **Premature Recovery Declaration**: System marked healthy immediately after deploy before database warm-up or dependent cache readiness.
   - *Mitigation*: Health check probe must verify database connectivity and readiness prior to deactivating maintenance mode.
