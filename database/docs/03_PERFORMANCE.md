# Performance: Database Migration, Backup & Disaster Recovery

## Migration Execution & Locking
- Migrations run inside explicit transactions (`BEGIN ... COMMIT`) to ensure atomicity.
- Index creation uses `CREATE INDEX CONCURRENTLY` in PostgreSQL to prevent read/write table locks during production migrations.
- Backups use snapshot-level physical disk cloning or streaming WAL archiving rather than heavy `pg_dump` locks on high-traffic tables.
