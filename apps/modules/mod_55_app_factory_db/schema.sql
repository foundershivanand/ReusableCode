-- Factory Master Portfolio Schema
CREATE TABLE IF NOT EXISTS portfolio_apps (
    product_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    bundle_id TEXT UNIQUE NOT NULL,
    package_name TEXT UNIQUE NOT NULL,
    platform TEXT CHECK(platform IN ('android', 'ios', 'both')) NOT NULL,
    stage TEXT NOT NULL,
    monetization TEXT NOT NULL,
    backend_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apps_stage ON portfolio_apps(stage);
CREATE INDEX IF NOT EXISTS idx_apps_bundle ON portfolio_apps(bundle_id);
