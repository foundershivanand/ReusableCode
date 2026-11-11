-- Isolated Database Schema for SoundScape AI (app-037)
CREATE TABLE IF NOT EXISTS user_profile (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscription_tier TEXT DEFAULT 'free',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    synced_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profile(id)
);
