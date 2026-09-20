import { createClient, type Client } from "@libsql/client";
import { getConfig } from "./config.ts";

let clientInstance: Client | null = null;

export function getDbClient(): Client {
  if (!clientInstance) {
    const config = getConfig();
    clientInstance = createClient({
      url: config.databaseUrl,
      authToken: config.authToken,
    });
  }
  return clientInstance;
}

export function resetDbClient(): void {
  if (clientInstance) {
    clientInstance.close();
    clientInstance = null;
  }
}

export async function initDatabase(client?: Client): Promise<void> {
  const db = client || getDbClient();

  // Create tables and indexes
  await db.execute(`
    CREATE TABLE IF NOT EXISTS turso_files (
      id TEXT PRIMARY KEY,
      path TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      extension TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      category TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      sha256 TEXT NOT NULL,
      is_binary INTEGER NOT NULL,
      content_text TEXT,
      content_blob BLOB,
      metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_turso_files_path ON turso_files(path);
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_turso_files_category ON turso_files(category);
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_turso_files_extension ON turso_files(extension);
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_turso_files_mime ON turso_files(mime_type);
  `);
}
