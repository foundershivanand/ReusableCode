-- 001_initial_monitoring_schema.sql
-- Product Health, Monitoring & Incident System

CREATE TABLE IF NOT EXISTS monitoring_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  severity VARCHAR(32) NOT NULL DEFAULT 'SEV3_MINOR',
  state VARCHAR(32) NOT NULL DEFAULT 'DETECTED',
  affected_components JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT NOT NULL,
  public_message TEXT NOT NULL,
  runbook_url TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  mitigated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  postmortem JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_state ON monitoring_incidents(state, started_at DESC);

CREATE TABLE IF NOT EXISTS monitoring_incident_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES monitoring_incidents(id) ON DELETE CASCADE,
  state VARCHAR(32) NOT NULL,
  message TEXT NOT NULL,
  author VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint VARCHAR(255) NOT NULL,
  severity VARCHAR(32) NOT NULL,
  component VARCHAR(32) NOT NULL,
  message TEXT NOT NULL,
  incident_id UUID REFERENCES monitoring_incidents(id) ON DELETE SET NULL,
  suppressed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_fingerprint ON monitoring_alerts(fingerprint, created_at DESC);

CREATE TABLE IF NOT EXISTS monitoring_slos (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  target_percentage NUMERIC(5, 2) NOT NULL CHECK (target_percentage BETWEEN 0 AND 100),
  current_percentage NUMERIC(5, 2) NOT NULL CHECK (current_percentage BETWEEN 0 AND 100),
  period_days INT NOT NULL DEFAULT 30,
  status VARCHAR(16) NOT NULL DEFAULT 'MET',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
