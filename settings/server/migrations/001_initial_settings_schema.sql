-- Module 05: Settings, Preferences & Customization Schema
-- Database: PostgreSQL 14+

-- 1. User Settings
CREATE TABLE IF NOT EXISTS user_settings (
    user_id VARCHAR(64) PRIMARY KEY,
    schema_version INT NOT NULL DEFAULT 3,
    profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    appearance JSONB NOT NULL DEFAULT '{}'::jsonb,
    language JSONB NOT NULL DEFAULT '{}'::jsonb,
    privacy JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_updated_at ON user_settings(updated_at);

-- 2. Organization Settings
CREATE TABLE IF NOT EXISTS organization_settings (
    organization_id VARCHAR(64) PRIMARY KEY,
    schema_version INT NOT NULL DEFAULT 2,
    default_theme VARCHAR(20) NOT NULL DEFAULT 'system',
    enforce_mfa BOOLEAN NOT NULL DEFAULT FALSE,
    allowed_email_domains JSONB NOT NULL DEFAULT '[]'::jsonb,
    default_locale VARCHAR(10) NOT NULL DEFAULT 'en',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_settings_updated_at ON organization_settings(updated_at);
