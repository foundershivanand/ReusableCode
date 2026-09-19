-- 001_initial_flags_schema.sql
-- Feature flags and audit trail tables

CREATE TABLE IF NOT EXISTS feature_flags (
    key VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    is_kill_switch BOOLEAN NOT NULL DEFAULT FALSE,
    fail_closed BOOLEAN NOT NULL DEFAULT TRUE,
    percentage_rollout INT NOT NULL DEFAULT 0 CHECK (percentage_rollout >= 0 AND percentage_rollout <= 100),
    targeting_rules JSONB NOT NULL DEFAULT '[]',
    dependencies TEXT[] DEFAULT '{}',
    remote_config_schema JSONB,
    remote_config_value JSONB,
    owner VARCHAR(128) NOT NULL,
    lifecycle_state VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_flag_audits (
    id VARCHAR(64) PRIMARY KEY,
    flag_key VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL,
    actor VARCHAR(128) NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_lifecycle ON feature_flags(lifecycle_state);
CREATE INDEX IF NOT EXISTS idx_feature_flags_owner ON feature_flags(owner);
CREATE INDEX IF NOT EXISTS idx_feature_flag_audits_key ON feature_flag_audits(flag_key);
