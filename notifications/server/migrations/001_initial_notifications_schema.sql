-- Module 04: Transactional Email & Notification Center Schema
-- Database: PostgreSQL 14+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64),
    recipient_address VARCHAR(255) NOT NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('EMAIL', 'IN_APP', 'PUSH', 'WEBHOOK')),
    template VARCHAR(50) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('TRANSACTIONAL', 'MARKETING', 'SECURITY', 'LEGAL')),
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    priority VARCHAR(20) NOT NULL DEFAULT 'DEFAULT' CHECK (priority IN ('HIGH', 'DEFAULT', 'LOW')),
    status VARCHAR(20) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'BOUNCED', 'FAILED', 'COMPLAINED', 'CANCELED')),
    idempotency_key VARCHAR(128) UNIQUE,
    provider VARCHAR(50),
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    last_error TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_channel_read ON notifications(user_id, channel, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_status_created ON notifications(status, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_idempotency ON notifications(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 2. Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id VARCHAR(64) PRIMARY KEY,
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    in_app_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    marketing_emails BOOLEAN NOT NULL DEFAULT FALSE,
    digest_mode BOOLEAN NOT NULL DEFAULT FALSE,
    digest_frequency VARCHAR(20) NOT NULL DEFAULT 'DAILY' CHECK (digest_frequency IN ('DAILY', 'WEEKLY')),
    locale VARCHAR(10) NOT NULL DEFAULT 'en',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Notification Suppressions (Bounces & Spam Complaints)
CREATE TABLE IF NOT EXISTS notification_suppressions (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    recipient_address VARCHAR(255) NOT NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('EMAIL', 'IN_APP', 'PUSH', 'WEBHOOK')),
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('HARD_BOUNCE', 'SPAM_COMPLAINT', 'MANUAL_SUPPRESSION')),
    suppressed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_suppression_address_channel UNIQUE (recipient_address, channel)
);

CREATE INDEX IF NOT EXISTS idx_suppressions_address_channel ON notification_suppressions(recipient_address, channel);
