-- 001_initial_deployment_schema.sql
-- Environment & Deployment Management

CREATE TABLE IF NOT EXISTS deployment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(64) NOT NULL,
  commit_sha VARCHAR(64) NOT NULL,
  build_timestamp TIMESTAMPTZ NOT NULL,
  environment VARCHAR(32) NOT NULL,
  runtime VARCHAR(128) NOT NULL,
  database_version VARCHAR(128) NOT NULL,
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deployed_by VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE'
);

CREATE INDEX IF NOT EXISTS idx_deployments_env_date ON deployment_records(environment, deployed_at DESC);

CREATE TABLE IF NOT EXISTS deployment_config_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment VARCHAR(32) NOT NULL,
  drift_detected BOOLEAN NOT NULL DEFAULT FALSE,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
