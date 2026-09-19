-- Module 07: File Storage & Media Processing Schema
-- Database: PostgreSQL 14+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Files Table
CREATE TABLE IF NOT EXISTS files (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    sanitized_name VARCHAR(255) NOT NULL,
    storage_key VARCHAR(512) NOT NULL UNIQUE,
    size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    extension VARCHAR(20) NOT NULL,
    visibility VARCHAR(20) NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PRIVATE', 'PUBLIC', 'ORGANIZATION')),
    scan_status VARCHAR(20) NOT NULL DEFAULT 'SCANNING' CHECK (scan_status IN ('UPLOADING', 'SCANNING', 'SAFE', 'REJECTED')),
    etag VARCHAR(128),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_files_tenant_visibility ON files(tenant_id, visibility) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_files_storage_key ON files(storage_key);
CREATE INDEX IF NOT EXISTS idx_files_scan_status ON files(scan_status, created_at);

-- 2. Storage Quotas Table
CREATE TABLE IF NOT EXISTS storage_quotas (
    tenant_id VARCHAR(64) PRIMARY KEY,
    used_bytes BIGINT NOT NULL DEFAULT 0,
    max_bytes BIGINT NOT NULL DEFAULT 10737418240, -- 10 GB
    max_file_size_bytes BIGINT NOT NULL DEFAULT 52428800 -- 50 MB
);
