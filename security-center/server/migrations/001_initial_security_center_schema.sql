-- 001_initial_security_center_schema.sql
-- Security Center / Vulnerability & Compliance Dashboard

CREATE TABLE IF NOT EXISTS security_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(32) NOT NULL,
  category VARCHAR(32) NOT NULL,
  remediation_guidance TEXT NOT NULL,
  state VARCHAR(32) NOT NULL DEFAULT 'OPEN',
  suppressed BOOLEAN NOT NULL DEFAULT FALSE,
  suppression_reason TEXT,
  suppression_owner VARCHAR(255),
  suppression_expires_at TIMESTAMPTZ,
  approved_by VARCHAR(255),
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_findings_severity_state ON security_findings(severity, state);

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(64) NOT NULL,
  severity VARCHAR(32) NOT NULL,
  actor_id VARCHAR(255) NOT NULL,
  ip_address VARCHAR(64) NOT NULL,
  user_agent TEXT NOT NULL DEFAULT 'Unknown',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_actor ON security_events(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS security_posture_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_score NUMERIC(5, 2) NOT NULL,
  grade VARCHAR(4) NOT NULL,
  critical_count INT NOT NULL DEFAULT 0,
  high_count INT NOT NULL DEFAULT 0,
  medium_count INT NOT NULL DEFAULT 0,
  low_count INT NOT NULL DEFAULT 0,
  mfa_adoption_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posture_history_date ON security_posture_history(recorded_at DESC);
