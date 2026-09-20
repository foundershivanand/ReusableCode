import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface TursoStorageConfig {
  databaseUrl: string;
  authToken?: string;
  adminUsername: string;
  adminPassword: string;
  port: number;
  host: string;
}

/**
 * Basic .env parser that populates process.env if not already set.
 */
export function loadEnvFile(envPath?: string): void {
  const targetPath = envPath || resolve(process.cwd(), ".env");
  if (!existsSync(targetPath)) {
    return;
  }

  try {
    const content = readFileSync(targetPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch (err) {
    console.warn(`[turso-storage] Warning: could not read .env file at ${targetPath}:`, err);
  }
}

// Auto-load .env on import
loadEnvFile();

export function getConfig(): TursoStorageConfig {
  return {
    databaseUrl: process.env.TURSO_DATABASE_URL || "file:turso_files.db",
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    adminUsername: process.env.ADMIN_USERNAME || "admin",
    adminPassword: process.env.ADMIN_PASSWORD || "admin123",
    port: parseInt(process.env.PORT || "3000", 10),
    host: process.env.HOST || "0.0.0.0",
  };
}
