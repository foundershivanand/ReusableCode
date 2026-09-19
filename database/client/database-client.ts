import {
  MigrationRecord,
  BackupRecord,
  DisasterRecoveryConfig,
} from "../schemas/database-schemas.js";

export class DatabaseClient {
  constructor(
    private baseUrl: string = "/api/database",
    private headers: Record<string, string> = {}
  ) {}

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(errorData.message || `Database API error: ${res.status}`);
    }

    return res.json();
  }

  async getMigrations(): Promise<MigrationRecord[]> {
    return this.request<MigrationRecord[]>("/migrations");
  }

  async getBackups(): Promise<BackupRecord[]> {
    return this.request<BackupRecord[]>("/backups");
  }

  async triggerBackup(): Promise<BackupRecord> {
    return this.request<BackupRecord>("/backups", {
      method: "POST",
    });
  }

  async verifyRestore(backupId: string): Promise<{ success: boolean; durationMs: number }> {
    return this.request<{ success: boolean; durationMs: number }>(`/backups/${encodeURIComponent(backupId)}/verify-restore`, {
      method: "POST",
    });
  }

  async getDisasterRecoveryConfig(): Promise<DisasterRecoveryConfig> {
    return this.request<DisasterRecoveryConfig>("/dr-config");
  }
}
