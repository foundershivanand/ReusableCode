-- 001_initial_i18n_schema.sql
-- Multi-Language & i18n Infrastructure

CREATE TABLE IF NOT EXISTS i18n_locales (
  code VARCHAR(16) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  native_name VARCHAR(128) NOT NULL,
  direction VARCHAR(8) NOT NULL DEFAULT 'ltr' CHECK (direction IN ('ltr', 'rtl')),
  default_currency VARCHAR(8) NOT NULL DEFAULT 'USD',
  default_timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  calendar VARCHAR(32) NOT NULL DEFAULT 'gregory',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS i18n_dictionaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locale VARCHAR(16) NOT NULL REFERENCES i18n_locales(code) ON DELETE CASCADE,
  namespace VARCHAR(64) NOT NULL DEFAULT 'common',
  version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
  translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_locale_namespace UNIQUE (locale, namespace)
);

CREATE INDEX IF NOT EXISTS idx_i18n_dict_locale_ns ON i18n_dictionaries(locale, namespace);

CREATE TABLE IF NOT EXISTS i18n_missing_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locale VARCHAR(16) NOT NULL,
  namespace VARCHAR(64) NOT NULL,
  key_path VARCHAR(255) NOT NULL,
  last_requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_missing_key UNIQUE (locale, namespace, key_path)
);
