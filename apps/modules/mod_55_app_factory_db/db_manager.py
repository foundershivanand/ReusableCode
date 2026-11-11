import sqlite3
import os

class FactoryDatabaseManager:
    def __init__(self, db_path: str = "/tmp/factory_meta.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS factory_apps (
                    app_id TEXT PRIMARY KEY,
                    name TEXT,
                    bundle_id TEXT,
                    status TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

    def register_app(self, app_id: str, name: str, bundle_id: str):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT OR REPLACE INTO factory_apps (app_id, name, bundle_id, status) VALUES (?, ?, ?, ?)",
                (app_id, name, bundle_id, "ACTIVE")
            )
