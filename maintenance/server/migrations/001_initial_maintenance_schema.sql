-- 001_initial_maintenance_schema.sql
-- Maintenance Mode, Status & System Banners

CREATE TABLE IF NOT EXISTS maintenance_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode VARCHAR(32) NOT NULL DEFAULT 'OFF',
  scope VARCHAR(32) NOT NULL DEFAULT 'GLOBAL',
  target VARCHAR(255) NOT NULL DEFAULT '*',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  admin_bypass_secret_hash VARCHAR(255),
  allowed_roles JSONB NOT NULL DEFAULT '["admin", "superadmin"]'::jsonb,
  allowed_user_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  allowed_ips JSONB NOT NULL DEFAULT '[]'::jsonb,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maint_scope_mode ON maintenance_configs(scope, mode);

CREATE TABLE IF NOT EXISTS maintenance_system_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(32) NOT NULL DEFAULT 'INFO',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label VARCHAR(64),
  dismissible BOOLEAN NOT NULL DEFAULT TRUE,
  target_scope VARCHAR(32) NOT NULL DEFAULT 'ALL',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maint_banners_active ON maintenance_system_banners(is_active, starts_at, ends_at);
