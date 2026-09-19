-- 001_initial_compliance_schema.sql
-- Legal consent evidence, data subject requests, retention policies, and vendor inventory

CREATE TABLE IF NOT EXISTS consent_evidence (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    terms_version VARCHAR(32) NOT NULL,
    privacy_version VARCHAR(32) NOT NULL,
    accepted_terms BOOLEAN NOT NULL,
    accepted_privacy BOOLEAN NOT NULL,
    marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
    cookie_consent JSONB NOT NULL DEFAULT '{"essential": true, "analytics": false, "marketing": false, "functional": false}',
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_ip VARCHAR(64),
    user_agent TEXT,
    jurisdiction VARCHAR(16) NOT NULL DEFAULT 'US',
    immutable_hash VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS data_subject_requests (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
    reason TEXT,
    identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(64),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    result_download_url TEXT,
    download_expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS retention_policies (
    category VARCHAR(64) PRIMARY KEY,
    retention_period_days INT NOT NULL,
    legal_hold_exempt BOOLEAN NOT NULL DEFAULT TRUE,
    auto_purge BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_processors (
    name VARCHAR(128) PRIMARY KEY,
    category VARCHAR(64) NOT NULL,
    purposes TEXT[] NOT NULL,
    data_categories TEXT[] NOT NULL,
    region VARCHAR(32) NOT NULL,
    dpa_signed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_consent_user_tenant ON consent_evidence(tenant_id, user_id, accepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_dsr_tenant_status ON data_subject_requests(tenant_id, status);
