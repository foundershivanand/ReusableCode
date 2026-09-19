-- Module 08: Analytics, Event Tracking & Logging Schema
-- Database: PostgreSQL 14+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Analytics Events (Append-only)
CREATE TABLE IF NOT EXISTS analytics_events (
    id VARCHAR(64) PRIMARY KEY,
    event_version VARCHAR(100) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    user_id VARCHAR(64),
    organization_id VARCHAR(64),
    properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    idempotency_key VARCHAR(128) UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_analytics_user_name_ts ON analytics_events(user_id, event_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_idempotency ON analytics_events(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_org_id ON analytics_events(organization_id) WHERE organization_id IS NOT NULL;

-- 2. Structured Application Logs (Partitioned or Indexed by Level/Time)
CREATE TABLE IF NOT EXISTS application_logs (
    id VARCHAR(64) PRIMARY KEY,
    level VARCHAR(10) NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR')),
    message TEXT NOT NULL,
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    error_stack TEXT
);

CREATE INDEX IF NOT EXISTS idx_logs_level_ts ON application_logs(level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_request_id ON application_logs USING btree ((context->>'requestId')) WHERE (context->>'requestId') IS NOT NULL;
