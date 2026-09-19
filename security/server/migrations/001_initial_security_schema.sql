-- Module 09: Rate Limiting, Security & API Protection Schema
-- Database: PostgreSQL 14+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Rate Limit Buckets (Optional persistent store if Redis is unavailable)
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
    key VARCHAR(255) PRIMARY KEY,
    timestamps JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Blocked IPs (Abuse and Brute Force Prevention)
CREATE TABLE IF NOT EXISTS blocked_ips (
    ip_address VARCHAR(45) PRIMARY KEY,
    blocked_until TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_until ON blocked_ips(blocked_until);

-- 3. Security Events (SSRF attempts, request smuggling violations, brute force)
CREATE TABLE IF NOT EXISTS security_events (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    event_type VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    path TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_type_ts ON security_events(event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address);
