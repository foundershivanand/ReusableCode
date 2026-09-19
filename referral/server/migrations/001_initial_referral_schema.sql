-- 001_initial_referral_schema.sql
-- Affiliate accounts, referral attributions, and commission ledger

CREATE TABLE IF NOT EXISTS affiliate_accounts (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    referral_code VARCHAR(32) NOT NULL,
    commission_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    payout_email VARCHAR(255) NOT NULL,
    payout_method VARCHAR(32) NOT NULL DEFAULT 'STRIPE',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    requires_mfa_for_payout_change BOOLEAN NOT NULL DEFAULT TRUE,
    total_earned_cents BIGINT NOT NULL DEFAULT 0,
    total_paid_cents BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, referral_code)
);

CREATE TABLE IF NOT EXISTS referral_attributions (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    affiliate_id VARCHAR(64) NOT NULL REFERENCES affiliate_accounts(id) ON DELETE CASCADE,
    referral_code VARCHAR(32) NOT NULL,
    referred_user_id VARCHAR(64),
    visitor_ip VARCHAR(64),
    device_fingerprint VARCHAR(128),
    payment_method_fingerprint VARCHAR(128),
    attribution_model VARCHAR(32) NOT NULL DEFAULT 'LAST_TOUCH',
    attributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_flagged_fraud BOOLEAN NOT NULL DEFAULT FALSE,
    fraud_reason TEXT
);

CREATE TABLE IF NOT EXISTS commission_ledger (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    affiliate_id VARCHAR(64) NOT NULL REFERENCES affiliate_accounts(id) ON DELETE CASCADE,
    attribution_id VARCHAR(64) NOT NULL REFERENCES referral_attributions(id),
    payment_id VARCHAR(64) NOT NULL UNIQUE,
    amount_cents BIGINT NOT NULL,
    commission_cents BIGINT NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'USD',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    reversed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_affiliate_code ON affiliate_accounts(tenant_id, referral_code);
CREATE INDEX IF NOT EXISTS idx_attributions_user ON referral_attributions(tenant_id, referred_user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_payment ON commission_ledger(payment_id);
CREATE INDEX IF NOT EXISTS idx_commissions_affiliate ON commission_ledger(affiliate_id, status);
