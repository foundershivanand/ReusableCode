# Risks & Failures: Database Migration, Backup & Disaster Recovery

## Failure Modes & Mitigations
1. **Silent Backup Corruption**: Backups are created and stored, but cannot be restored due to archive corruption or encryption key loss.
   - *Mitigation*: Automated weekly restore drills verify that snapshots can be decrypted and restored into isolated test targets.
2. **Concurrent Migration Race**: Two application pods boot at the same time and attempt to apply schema migrations concurrently.
   - *Mitigation*: Application acquires PostgreSQL advisory lock `SELECT pg_advisory_lock(1402394)` before checking applied migrations, releasing upon completion.
3. **Destructive Migration in Production**: Developer accidentally runs migration with `DROP TABLE users`.
   - *Mitigation*: Migration runner AST parser aborts immediately unless `ALLOW_DESTRUCTIVE_MIGRATIONS=true` is explicitly provided.
