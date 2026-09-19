-- 001_initial_experimentation_schema.sql
-- Experimentation & A/B Testing Infrastructure

CREATE TABLE IF NOT EXISTS experiment_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(128) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  mutual_exclusion_group VARCHAR(128),
  eligibility_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  primary_metric VARCHAR(128) NOT NULL,
  secondary_metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
  attribution_window_hours INT NOT NULL DEFAULT 72,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiment_definitions(status);

CREATE TABLE IF NOT EXISTS experiment_assignments (
  experiment_id UUID NOT NULL REFERENCES experiment_definitions(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  variant_id VARCHAR(64) NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exposed BOOLEAN NOT NULL DEFAULT FALSE,
  exposed_at TIMESTAMPTZ,
  PRIMARY KEY (experiment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_user ON experiment_assignments(user_id);

CREATE TABLE IF NOT EXISTS experiment_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiment_definitions(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  variant_id VARCHAR(64) NOT NULL,
  metric_name VARCHAR(128) NOT NULL,
  value NUMERIC(18, 4) NOT NULL DEFAULT 1,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversions_metric ON experiment_conversions(experiment_id, metric_name);
