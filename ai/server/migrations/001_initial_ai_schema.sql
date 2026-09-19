-- Module 10: AI Infrastructure Schema Migration
-- Designed for high concurrency, zero cross-module coupling, and multi-tenant budget isolation.

CREATE TABLE IF NOT EXISTS ai_requests (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    feature VARCHAR(100) NOT NULL DEFAULT 'general',
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    prompt_tokens INT NOT NULL DEFAULT 0,
    completion_tokens INT NOT NULL DEFAULT 0,
    total_tokens INT NOT NULL DEFAULT 0,
    cost_micro_cents BIGINT NOT NULL DEFAULT 0,
    idempotency_key VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_requests_tenant_created ON ai_requests (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_requests_idempotency ON ai_requests (tenant_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_requests_feature ON ai_requests (feature, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_budgets (
    tenant_id VARCHAR(255) PRIMARY KEY,
    daily_micro_cents_limit BIGINT NOT NULL DEFAULT 50000000, -- $50.00
    monthly_micro_cents_limit BIGINT NOT NULL DEFAULT 1000000000, -- $1000.00
    current_daily_micro_cents BIGINT NOT NULL DEFAULT 0,
    current_monthly_micro_cents BIGINT NOT NULL DEFAULT 0,
    kill_switch_active BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_budgets_kill_switch ON ai_budgets (kill_switch_active);

CREATE TABLE IF NOT EXISTS ai_jobs (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
    progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    attempts INT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    max_attempts INT NOT NULL DEFAULT 3 CHECK (max_attempts >= 1),
    last_error TEXT,
    result JSONB,
    idempotency_key VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_queue ON ai_jobs (status, name, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_tenant ON ai_jobs (tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_idempotency ON ai_jobs (tenant_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS ai_tool_executions (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    tool_name VARCHAR(100) NOT NULL,
    arguments JSONB NOT NULL DEFAULT '{}'::jsonb,
    authorized BOOLEAN NOT NULL DEFAULT TRUE,
    result JSONB,
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_tool_executions_tenant ON ai_tool_executions (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_tool_executions_tool ON ai_tool_executions (tool_name, authorized);
