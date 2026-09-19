-- 001_initial_onboarding_schema.sql
-- Onboarding flow definitions and user progress tables

CREATE TABLE IF NOT EXISTS onboarding_flows (
    id VARCHAR(64) PRIMARY KEY,
    version VARCHAR(32) NOT NULL DEFAULT 'v1',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    steps JSONB NOT NULL DEFAULT '[]',
    target_roles TEXT[] DEFAULT '{}',
    product_key VARCHAR(64) NOT NULL DEFAULT 'default',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_onboarding_states (
    id VARCHAR(128) PRIMARY KEY, -- format: userId:flowId
    user_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    flow_id VARCHAR(64) NOT NULL REFERENCES onboarding_flows(id) ON DELETE CASCADE,
    flow_version VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'NOT_STARTED',
    current_step_index INT NOT NULL DEFAULT 0,
    step_states JSONB NOT NULL DEFAULT '{}',
    progress_percentage INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    skipped_at TIMESTAMPTZ,
    last_resumed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding_states(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_tenant_id ON user_onboarding_states(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_status ON user_onboarding_states(status);
