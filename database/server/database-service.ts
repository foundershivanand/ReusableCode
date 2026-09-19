import { createHash, randomUUID } from "node:crypto";
import {
  MigrationRecord,
  BackupRecord,
  MigrationSafetyCheckResult,
  DisasterRecoveryConfig,
} from "../schemas/database-schemas.js";
import { DatabaseRepository } from "./repository.js";

export class DatabaseService {
  private isMigrationLocked = false;

  constructor(
    private repository: DatabaseRepository,
    private drConfig: DisasterRecoveryConfig = {
      targetRpoMinutes: 60,
      targetRtoMinutes: 120,
      retentionDays: 30,
      immutableLockEnabled: true,
      owner: "Database Reliability Engineering",
    }
  ) {}

  analyzeMigrationSafety(sql: string, allowDestructive: boolean = false): MigrationSafetyCheckResult {
    const prohibited: string[] = [];
    const warnings: string[] = [];

    const dropTableRegex = /\bDROP\s+TABLE\b/i;
    const dropColumnRegex = /\bALTER\s+TABLE\s+.*\bDROP\s+COLUMN\b/i;
    const truncateRegex = /\bTRUNCATE\s+(TABLE\s+)?/i;

    if (dropTableRegex.test(sql)) prohibited.push("DROP TABLE");
    if (dropColumnRegex.test(sql)) prohibited.push("DROP COLUMN");
    if (truncateRegex.test(sql)) prohibited.push("TRUNCATE");

    const isDestructive = prohibited.length > 0;
    if (isDestructive && !allowDestructive) {
      warnings.push(`Destructive migration detected containing: ${prohibited.join(", ")}. Requires explicit override flag.`);
    }

    return {
      isDestructive,
      warnings,
      prohibitedOperations: prohibited,
      requiresOverride: isDestructive && !allowDestructive,
    };
  }

  async acquireMigrationLock(): Promise<boolean> {
    if (this.isMigrationLocked) {
      return false;
    }
    this.isMigrationLocked = true;
    return true;
  }

  async releaseMigrationLock(): Promise<void> {
    this.isMigrationLocked = false;
  }

  async applyMigration(params: {
    name: string;
    version: string;
    sql: string;
    rollbackSql?: string;
    allowDestructive?: boolean;
  }): Promise<MigrationRecord> {
    const lockAcquired = await this.acquireMigrationLock();
    if (!lockAcquired) {
      throw new Error("Cannot run migration: another migration process is currently executing (migration locked)");
    }

    try {
      const existing = await this.repository.getMigrationByVersion(params.version);
      if (existing && existing.status === "APPLIED") {
        throw new Error(`Migration version ${params.version} has already been applied`);
      }

      const safety = this.analyzeMigrationSafety(params.sql, params.allowDestructive);
      if (safety.requiresOverride) {
        throw new Error(`Migration rejected by safety checks: ${safety.warnings.join("; ")}`);
      }

      const start = Date.now();
      const checksum = createHash("sha256").update(params.sql).digest("hex");
      const durationMs = Date.now() - start;

      const record: MigrationRecord = {
        id: randomUUID(),
        name: params.name,
        version: params.version,
        checksum,
        appliedAt: new Date().toISOString(),
        executionTimeMs: Math.max(1, durationMs),
        status: "APPLIED",
        rollbackSql: params.rollbackSql || null,
      };

      await this.repository.saveMigration(record);
      return record;
    } finally {
      await this.releaseMigrationLock();
    }
  }

  async rollbackMigration(version: string): Promise<MigrationRecord> {
    const lockAcquired = await this.acquireMigrationLock();
    if (!lockAcquired) {
      throw new Error("Cannot rollback migration: another migration process is currently executing");
    }

    try {
      const record = await this.repository.getMigrationByVersion(version);
      if (!record) {
        throw new Error(`Migration version ${version} not found`);
      }
      if (record.status !== "APPLIED") {
        throw new Error(`Migration ${version} is not in APPLIED state (current: ${record.status})`);
      }
      if (!record.rollbackSql) {
        throw new Error(`Migration ${version} cannot be safely rolled back: no rollback SQL provided`);
      }

      record.status = "ROLLED_BACK";
      await this.repository.updateMigration(record);
      return record;
    } finally {
      await this.releaseMigrationLock();
    }
  }

  async createBackup(params: {
    backupType: "FULL_SNAPSHOT" | "WAL_ARCHIVE" | "LOGICAL_EXPORT";
    sizeBytes: number;
    storageBucket?: string;
  }): Promise<BackupRecord> {
    const backupId = randomUUID();
    const bucket = params.storageBucket || "s3://prod-backups-immutable-worm";

    const record: BackupRecord = {
      id: backupId,
      backupType: params.backupType,
      status: "COMPLETED",
      sizeBytes: params.sizeBytes,
      storageLocation: `${bucket}/backup_${backupId}_${Date.now()}.enc`,
      encrypted: true,
      verifiedAt: null,
      rpoSeconds: this.drConfig.targetRpoMinutes * 60,
      createdAt: new Date().toISOString(),
    };

    await this.repository.saveBackup(record);
    return record;
  }

  async verifyRestoreDrill(backupId: string): Promise<{ success: boolean; durationMs: number }> {
    const backup = await this.repository.getBackupById(backupId);
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }

    const start = Date.now();
    // Simulate restore verification: row count checks, foreign keys, schema smoke test
    const durationMs = 120; // 120ms simulated drill
    backup.verifiedAt = new Date().toISOString();
    backup.status = "VERIFIED";
    await this.repository.updateBackup(backup);

    await this.repository.recordRestoreDrill({
      backupId,
      status: "SUCCESS",
      durationMs,
      integrityPassed: true,
    });

    return { success: true, durationMs };
  }

  async checkBackupHealth(): Promise<{ healthy: boolean; warnings: string[] }> {
    const backups = await this.repository.getBackups();
    const warnings: string[] = [];

    if (backups.length === 0) {
      warnings.push("No backups exist in repository");
      return { healthy: false, warnings };
    }

    const latest = backups[0];
    const ageMinutes = (Date.now() - new Date(latest.createdAt).getTime()) / 60000;
    if (ageMinutes > this.drConfig.targetRpoMinutes) {
      warnings.push(`Latest backup is ${Math.round(ageMinutes)} minutes old, exceeding target RPO of ${this.drConfig.targetRpoMinutes} minutes`);
    }

    if (!latest.verifiedAt) {
      warnings.push(`Latest backup ${latest.id} has not undergone a restore verification drill`);
    }

    return {
      healthy: warnings.length === 0,
      warnings,
    };
  }

  getDisasterRecoveryConfig(): DisasterRecoveryConfig {
    return { ...this.drConfig };
  }
}
