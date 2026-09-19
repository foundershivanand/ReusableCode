-- 001_initial_webhooks_schema.sql
-- Public API keys, webhook endpoints, and delivery logs

CREATE TABLE IF NOT EXISTS api_keys (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    prefix VARCHAR(32) NOT NULL UNIQUE,
    key_hash VARCHAR(64) NOT NULL,
    scopes TEXT[] NOT NULL,
    rate_limit_per_minute INT NOT NULL DEFAULT 60,
    lifecycle_state VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    last_used_ip VARCHAR(64),
    last_used_user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    url VARCHAR(512) NOT NULL,
    description TEXT,
    event_types TEXT[] NOT NULL,
    secret VARCHAR(128) NOT NULL,
    previous_secret VARCHAR(128),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    schema_version VARCHAR(16) NOT NULL DEFAULT 'v1',
    ownership_verified BOOLEAN NOT NULL DEFAULT FALSE,
    consecutive_failures INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_delivery_logs (
    id VARCHAR(64) PRIMARY KEY,
    endpoint_id VARCHAR(64) NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    tenant_id VARCHAR(64) NOT NULL,
    event_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    attempt_number INT NOT NULL,
    status_code INT,
    status VARCHAR(32) NOT NULL,
    response_body TEXT,
    error_message TEXT,
    duration_ms INT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_tenant ON webhook_endpoints(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_endpoint ON webhook_delivery_logs(endpoint_id, timestamp DESC);
