-- ==============================================================================
-- Module 01: Production Auth Schema (PostgreSQL 14+)
-- Designed for scale: 100 to 1,000,000+ users
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    password_hash VARCHAR(255),
    role VARCHAR(32) NOT NULL DEFAULT 'USER',
    account_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(128),
    mfa_last_used_step BIGINT NOT NULL DEFAULT 0,
    session_version INT NOT NULL DEFAULT 1,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_users_role CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN')),
    CONSTRAINT chk_users_status CHECK (account_status IN (
        'PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'LOCKED', 'DEACTIVATED', 'DELETED'
    ))
);

-- Unique functional index on lowercase email for fast authentication & collision prevention
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users (account_status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);

-- 2. Sessions Table (Partition-ready for 1,000,000+ concurrent sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL,
    user_agent VARCHAR(512),
    ip_address VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    session_version INT NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions (last_active_at);

-- 3. OAuth Accounts Table
CREATE TABLE IF NOT EXISTS oauth_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(32) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id),
    CONSTRAINT chk_oauth_provider CHECK (provider IN ('google', 'github', 'apple'))
);

CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts (user_id);

-- 4. Verification Tokens Table (Single-use hashed tokens)
CREATE TABLE IF NOT EXISTS verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_hash CHAR(64) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    purpose VARCHAR(32) NOT NULL,
    metadata JSONB,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_token_purpose CHECK (purpose IN (
        'email_verification', 'password_reset', 'magic_link', 'email_change'
    ))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_tokens_hash ON verification_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_purpose ON verification_tokens (user_id, purpose);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON verification_tokens (expires_at);

-- 5. MFA Recovery Codes Table
CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash CHAR(64) NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_mfa_user_code UNIQUE (user_id, code_hash)
);

CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_user ON mfa_recovery_codes (user_id);

-- 6. Password History Table (Prevents recent password reuse)
CREATE TABLE IF NOT EXISTS password_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history (user_id, created_at DESC);

-- 7. Audit Logs Table (Append-only, partition-ready by timestamp)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_type VARCHAR(32) NOT NULL,
    actor_id UUID,
    action VARCHAR(64) NOT NULL,
    target_type VARCHAR(32),
    target_id UUID,
    tenant_id VARCHAR(64),
    ip_address VARCHAR(128),
    user_agent VARCHAR(512),
    metadata JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
