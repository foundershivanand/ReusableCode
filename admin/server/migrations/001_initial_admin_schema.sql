-- Module 06: Admin Dashboard & Operations Control Schema
-- Database: PostgreSQL 14+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Admin Users (Separate from normal customer accounts)
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'SUPPORT_ADMIN', 'BILLING_ADMIN', 'READONLY_ADMIN')),
    mfa_enforced BOOLEAN NOT NULL DEFAULT TRUE,
    mfa_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- 2. Admin Sessions (Short inactivity and absolute timeout)
CREATE TABLE IF NOT EXISTS admin_sessions (
    id VARCHAR(64) PRIMARY KEY,
    admin_id VARCHAR(64) NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NOT NULL,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- 3. Immutable Admin Audit Logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    admin_id VARCHAR(64) NOT NULL REFERENCES admin_users(id),
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(30) NOT NULL,
    target_id VARCHAR(64) NOT NULL,
    reason TEXT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_timestamp ON admin_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);

-- 4. Break-Glass Events
CREATE TABLE IF NOT EXISTS admin_break_glass_events (
    id VARCHAR(64) PRIMARY KEY,
    admin_id VARCHAR(64) NOT NULL REFERENCES admin_users(id),
    reason TEXT NOT NULL,
    duration_minutes INT NOT NULL,
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_break_glass_admin ON admin_break_glass_events(admin_id, expires_at);
