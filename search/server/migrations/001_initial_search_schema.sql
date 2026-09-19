-- 001_initial_search_schema.sql
-- Search index table with full-text search vector and permission metadata

CREATE TABLE IF NOT EXISTS search_documents (
    id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    type VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    url VARCHAR(512) NOT NULL,
    allowed_roles TEXT[] DEFAULT '{}',
    allowed_user_ids TEXT[] DEFAULT '{}',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    index_version INT NOT NULL DEFAULT 1,
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || content)) STORED,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS search_reindex_jobs (
    job_id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    total_documents INT NOT NULL,
    processed_documents INT NOT NULL DEFAULT 0,
    failed_documents INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_search_vector ON search_documents USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_search_tenant_deleted ON search_documents(tenant_id, is_deleted);
