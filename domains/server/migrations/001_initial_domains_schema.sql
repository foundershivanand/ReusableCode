-- 001_initial_domains_schema.sql
-- Custom Domain & White-Label Engine

CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'REQUESTED',
  ssl_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_ISSUANCE',
  verification_token VARCHAR(255) NOT NULL,
  dns_challenges JSONB NOT NULL DEFAULT '[]'::jsonb,
  verified_at TIMESTAMPTZ,
  ssl_expires_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_domains_tenant ON custom_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_status ON custom_domains(status);

CREATE TABLE IF NOT EXISTS tenant_branding (
  tenant_id VARCHAR(255) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  dark_logo_url TEXT,
  favicon_url TEXT,
  primary_color VARCHAR(16) NOT NULL DEFAULT '#2563eb',
  accent_color VARCHAR(16) NOT NULL DEFAULT '#3b82f6',
  support_email VARCHAR(255),
  sender_email_domain VARCHAR(255),
  sender_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
