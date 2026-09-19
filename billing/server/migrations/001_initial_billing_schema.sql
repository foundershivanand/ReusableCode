-- ==============================================================================
-- Module 02: Production Billing Schema (PostgreSQL 14+)
-- Independent from Module 01. Scales to 1,000,000+ users & transactions.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Customers
CREATE TABLE IF NOT EXISTS billing_customers (
    id VARCHAR(128) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    provider_customer_id VARCHAR(255),
    provider VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_customers_email ON billing_customers (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_billing_customers_provider ON billing_customers (provider, provider_customer_id);

-- 2. Plans
CREATE TABLE IF NOT EXISTS billing_plans (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    amount_minor_units INT NOT NULL,
    currency VARCHAR(8) NOT NULL,
    interval VARCHAR(16) NOT NULL,
    trial_days INT NOT NULL DEFAULT 0,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    limits JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Subscriptions
CREATE TABLE IF NOT EXISTS billing_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id VARCHAR(128) NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
    plan_id VARCHAR(64) NOT NULL REFERENCES billing_plans(id),
    status VARCHAR(32) NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    provider VARCHAR(32) NOT NULL,
    provider_subscription_id VARCHAR(255) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_subscription_status CHECK (status IN (
        'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'PAUSED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_billing_sub_customer ON billing_subscriptions (customer_id, status);
CREATE INDEX IF NOT EXISTS idx_billing_sub_provider ON billing_subscriptions (provider, provider_subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_sub_period_end ON billing_subscriptions (current_period_end);

-- 4. Invoices (Price Immutability Snapshots)
CREATE TABLE IF NOT EXISTS billing_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id VARCHAR(128) NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES billing_subscriptions(id) ON DELETE SET NULL,
    currency VARCHAR(8) NOT NULL,
    subtotal_minor_units INT NOT NULL,
    tax_minor_units INT NOT NULL DEFAULT 0,
    discount_minor_units INT NOT NULL DEFAULT 0,
    total_minor_units INT NOT NULL,
    status VARCHAR(32) NOT NULL,
    line_items JSONB NOT NULL,
    invoice_pdf_url TEXT,
    provider_invoice_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,

    CONSTRAINT chk_invoice_status CHECK (status IN ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE'))
);

CREATE INDEX IF NOT EXISTS idx_billing_inv_customer ON billing_invoices (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_inv_provider ON billing_invoices (provider_invoice_id);

-- 5. Payments
CREATE TABLE IF NOT EXISTS billing_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id VARCHAR(128) NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES billing_invoices(id) ON DELETE SET NULL,
    amount_minor_units INT NOT NULL,
    currency VARCHAR(8) NOT NULL,
    status VARCHAR(32) NOT NULL,
    provider VARCHAR(32) NOT NULL,
    provider_payment_id VARCHAR(255) NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_billing_payments_idempotency UNIQUE (idempotency_key),
    CONSTRAINT chk_payment_status CHECK (status IN (
        'PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED', 'CANCELED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_billing_payments_customer ON billing_payments (customer_id, created_at DESC);

-- 6. Refunds
CREATE TABLE IF NOT EXISTS billing_refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES billing_payments(id) ON DELETE CASCADE,
    customer_id VARCHAR(128) NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
    amount_minor_units INT NOT NULL,
    currency VARCHAR(8) NOT NULL,
    status VARCHAR(32) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    provider_refund_id VARCHAR(255),
    idempotency_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_billing_refunds_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_billing_refunds_payment ON billing_refunds (payment_id);

-- 7. Disputes
CREATE TABLE IF NOT EXISTS billing_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES billing_payments(id) ON DELETE CASCADE,
    customer_id VARCHAR(128) NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
    amount_minor_units INT NOT NULL,
    currency VARCHAR(8) NOT NULL,
    status VARCHAR(32) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    provider_dispute_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Coupons
CREATE TABLE IF NOT EXISTS billing_coupons (
    code VARCHAR(32) PRIMARY KEY,
    discount_type VARCHAR(16) NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(8),
    max_redemptions INT,
    redemptions_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 9. Processed Webhooks (Idempotency & Replay Protection)
CREATE TABLE IF NOT EXISTS billing_processed_webhooks (
    provider VARCHAR(32) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    provider_timestamp TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(32) NOT NULL,
    failure_reason TEXT,

    PRIMARY KEY (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_processed_webhooks_timestamp ON billing_processed_webhooks (processed_at DESC);
