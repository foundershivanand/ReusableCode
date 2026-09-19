import {
  MigrationRecord,
  BackupRecord,
} from "../schemas/database-schemas.js";

export interface DatabaseRepository {
  getAppliedMigrations(): Promise<MigrationRecord[]>;
  getMigrationByVersion(version: string): Promise<MigrationRecord | null>;
  saveMigration(record: MigrationRecord): Promise<void>;
  updateMigration(record: MigrationRecord): Promise<void>;
  getBackups(): Promise<BackupRecord[]>;
  getBackupById(id: string): Promise<BackupRecord | null>;
  saveBackup(record: BackupRecord): Promise<void>;
  updateBackup(record: BackupRecord): Promise<void>;
  recordRestoreDrill(params: {
    backupId: string;
    status: string;
    durationMs: number;
    integrityPassed: boolean;
  }): Promise<void>;
}

export class InMemoryDatabaseRepository implements DatabaseRepository {
  private migrations = new Map<string, MigrationRecord>();
  private backups = new Map<string, BackupRecord>();
  private restoreDrills: Array<{
    backupId: string;
    status: string;
    durationMs: number;
    integrityPassed: boolean;
    conductedAt: string;
  }> = [];

  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    return Array.from(this.migrations.values())
      .filter((m) => m.status === "APPLIED")
      .sort((a, b) => a.version.localeCompare(b.version));
  }

  async getMigrationByVersion(version: string): Promise<MigrationRecord | null> {
    for (const m of this.migrations.values()) {
      if (m.version === version) return { ...m };
    }
    return null;
  }

  async saveMigration(record: MigrationRecord): Promise<void> {
    this.migrations.set(record.id, { ...record });
  }

  async updateMigration(record: MigrationRecord): Promise<void> {
    this.migrations.set(record.id, { ...record });
  }

  async getBackups(): Promise<BackupRecord[]> {
    return Array.from(this.backups.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getBackupById(id: string): Promise<BackupRecord | null> {
    const b = this.backups.get(id);
    return b ? { ...b } : null;
  }

  async saveBackup(record: BackupRecord): Promise<void> {
    this.backups.set(record.id, { ...record });
  }

  async updateBackup(record: BackupRecord): Promise<void> {
    this.backups.set(record.id, { ...record });
  }

  async recordRestoreDrill(params: {
    backupId: string;
    status: string;
    durationMs: number;
    integrityPassed: boolean;
  }): Promise<void> {
    this.restoreDrills.push({
      ...params,
      conductedAt: new Date().toISOString(),
    });
  }
}
