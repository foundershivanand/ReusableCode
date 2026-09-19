-- 001_initial_metering_schema.sql
-- Transaction-safe usage and credit ledger

CREATE TABLE IF NOT EXISTS metering_balances (
  tenant_id VARCHAR(255) PRIMARY KEY,
  available_balance NUMERIC(18, 4) NOT NULL DEFAULT 0,
  reserved_balance NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (reserved_balance >= 0),
  lifetime_purchased NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (lifetime_purchased >= 0),
  lifetime_consumed NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (lifetime_consumed >= 0),
  currency VARCHAR(32) NOT NULL DEFAULT 'CREDITS',
  version INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metering_credit_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES metering_balances(tenant_id) ON DELETE CASCADE,
  amount NUMERIC(18, 4) NOT NULL CHECK (amount > 0),
  remaining_amount NUMERIC(18, 4) NOT NULL CHECK (remaining_amount >= 0),
  expires_at TIMESTAMPTZ,
  priority INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metering_grants_tenant_exp 
  ON metering_credit_grants(tenant_id, priority ASC, expires_at ASC NULLS LAST);

CREATE TABLE IF NOT EXISTS metering_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  entry_type VARCHAR(64) NOT NULL,
  amount NUMERIC(18, 4) NOT NULL,
  balance_after NUMERIC(18, 4) NOT NULL,
  idempotency_key VARCHAR(255) UNIQUE,
  reservation_id UUID,
  pricing_version VARCHAR(32) NOT NULL DEFAULT 'v1',
  reason TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metering_ledger_tenant_created 
  ON metering_ledger(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS metering_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES metering_balances(tenant_id) ON DELETE CASCADE,
  operation_id VARCHAR(255) NOT NULL,
  estimated_amount NUMERIC(18, 4) NOT NULL CHECK (estimated_amount > 0),
  actual_amount NUMERIC(18, 4) CHECK (actual_amount >= 0),
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metering_reservations_tenant_status 
  ON metering_reservations(tenant_id, status);

CREATE TABLE IF NOT EXISTS metering_auto_recharge (
  tenant_id VARCHAR(255) PRIMARY KEY REFERENCES metering_balances(tenant_id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  threshold_balance NUMERIC(18, 4) NOT NULL DEFAULT 100,
  recharge_amount NUMERIC(18, 4) NOT NULL DEFAULT 500 CHECK (recharge_amount > 0),
  max_monthly_recharges INT NOT NULL DEFAULT 5,
  current_monthly_count INT NOT NULL DEFAULT 0,
  payment_method_id VARCHAR(255),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metering_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(128) NOT NULL,
  quantity NUMERIC(18, 4) NOT NULL CHECK (quantity > 0),
  unit_cost_credits NUMERIC(18, 4) NOT NULL DEFAULT 1 CHECK (unit_cost_credits >= 0),
  pricing_version VARCHAR(32) NOT NULL DEFAULT 'v1',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metering_usage_events_tenant_created 
  ON metering_usage_events(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS metering_usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  threshold_percent INT NOT NULL CHECK (threshold_percent BETWEEN 1 AND 100),
  notify_email VARCHAR(255) NOT NULL,
  triggered BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
