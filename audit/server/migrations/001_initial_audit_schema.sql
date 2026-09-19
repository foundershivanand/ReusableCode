-- 001_initial_audit_schema.sql
-- Immutable audit log table with cryptographic hash chaining

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    actor JSONB NOT NULL,
    action VARCHAR(64) NOT NULL,
    target JSONB NOT NULL,
    request_id VARCHAR(64) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    before_state JSONB,
    after_state JSONB,
    metadata JSONB NOT NULL DEFAULT '{}',
    hash VARCHAR(64) NOT NULL,
    previous_hash VARCHAR(64) NOT NULL
);

-- Prevent updates or deletes via normal SQL (immutable append-only enforcement)
CREATE OR REPLACE RULE no_audit_update AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE OR REPLACE RULE no_audit_delete AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

CREATE INDEX IF NOT EXISTS idx_audit_tenant_timestamp ON audit_logs(tenant_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_actor_id ON audit_logs((actor->>'id'));
CREATE INDEX IF NOT EXISTS idx_audit_target_id ON audit_logs((target->>'id'));
