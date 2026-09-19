# Risks & Failures: Environment & Deployment Management

## Failure Modes & Mitigations
1. **Accidental Database Column Deletion**: Code is deployed that drops a column still queried by older container instances during rolling updates.
   - *Mitigation*: Expand/contract rule: never drop a column in the same release where code stops referencing it. First deploy code that ignores the column, then drop the column in a subsequent release.
2. **Missing Configuration on Boot**: New feature deployed without setting its required environment variable.
   - *Mitigation*: Zod startup validation aborts container startup immediately, triggering automated rollback before serving traffic.
3. **Rollback with Destructive Migrations**: Rollback of application code against a modified database schema fails.
   - *Mitigation*: All migrations must be backward-compatible with at least $N-1$ version of application code.
