-- 001_initial_portability_schema.sql
-- Export and import background jobs tracking

CREATE TABLE IF NOT EXISTS export_jobs (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    format VARCHAR(16) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    progress_percentage INT NOT NULL DEFAULT 0,
    total_rows INT NOT NULL DEFAULT 0,
    download_url TEXT,
    expires_at TIMESTAMPTZ,
    snapshot_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS import_jobs (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    strategy VARCHAR(32) NOT NULL DEFAULT 'ALL_OR_NOTHING',
    dry_run BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    total_rows INT NOT NULL DEFAULT 0,
    processed_rows INT NOT NULL DEFAULT 0,
    success_rows INT NOT NULL DEFAULT 0,
    failed_rows INT NOT NULL DEFAULT 0,
    errors JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_export_jobs_tenant ON export_jobs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_tenant ON import_jobs(tenant_id, status);
