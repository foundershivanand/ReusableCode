-- 001_initial_changelog_schema.sql
-- Changelog, Roadmap & What's New Infrastructure

CREATE TABLE IF NOT EXISTS changelog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  content_markdown TEXT NOT NULL,
  category VARCHAR(32) NOT NULL DEFAULT 'FEATURE',
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  version_tag VARCHAR(64),
  related_feature_flag VARCHAR(128),
  target_audience VARCHAR(32) NOT NULL DEFAULT 'ALL',
  author_id VARCHAR(255) NOT NULL,
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_changelog_status_published ON changelog_items(status, published_at DESC);

CREATE TABLE IF NOT EXISTS changelog_roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PLANNED',
  target_quarter VARCHAR(32) NOT NULL,
  upvotes_count INT NOT NULL DEFAULT 0,
  changelog_id UUID REFERENCES changelog_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_status_quarter ON changelog_roadmap_items(status, target_quarter);

CREATE TABLE IF NOT EXISTS changelog_read_states (
  user_id VARCHAR(255) NOT NULL,
  changelog_id UUID NOT NULL REFERENCES changelog_items(id) ON DELETE CASCADE,
  device_id VARCHAR(255),
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, changelog_id)
);

CREATE TABLE IF NOT EXISTS changelog_upvotes (
  user_id VARCHAR(255) NOT NULL,
  roadmap_id UUID NOT NULL REFERENCES changelog_roadmap_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, roadmap_id)
);
