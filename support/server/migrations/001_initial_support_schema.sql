-- 001_initial_support_schema.sql
-- Customer support tickets, impersonation sessions, and attachment tracking

CREATE TABLE IF NOT EXISTS support_tickets (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'CREATED',
    priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    assigned_to VARCHAR(64),
    browser_metadata JSONB,
    attachments JSONB NOT NULL DEFAULT '[]',
    content_hash VARCHAR(64),
    is_legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
    verified_identity BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    first_response_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS support_impersonation_sessions (
    id VARCHAR(64) PRIMARY KEY,
    admin_id VARCHAR(64) NOT NULL,
    target_user_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    reason TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_status ON support_tickets(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_hash ON support_tickets(tenant_id, content_hash);
CREATE INDEX IF NOT EXISTS idx_impersonation_target ON support_impersonation_sessions(target_user_id, expires_at);
