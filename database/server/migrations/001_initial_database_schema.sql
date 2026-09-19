-- 001_initial_database_schema.sql
-- Database Migration, Backup & Disaster Recovery

CREATE TABLE IF NOT EXISTS schema_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  version VARCHAR(64) NOT NULL UNIQUE,
  checksum VARCHAR(64) NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  execution_time_ms INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'APPLIED',
  rollback_sql TEXT
);

CREATE INDEX IF NOT EXISTS idx_migrations_version ON schema_migrations(version);

CREATE TABLE IF NOT EXISTS database_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type VARCHAR(32) NOT NULL DEFAULT 'FULL_SNAPSHOT',
  status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  storage_location TEXT NOT NULL,
  encrypted BOOLEAN NOT NULL DEFAULT TRUE,
  verified_at TIMESTAMPTZ,
  rpo_seconds INT NOT NULL DEFAULT 3600,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backups_created ON database_backups(created_at DESC);

CREATE TABLE IF NOT EXISTS database_restore_drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID NOT NULL REFERENCES database_backups(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL,
  drill_duration_ms INT NOT NULL,
  integrity_checks_passed BOOLEAN NOT NULL DEFAULT TRUE,
  conducted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
