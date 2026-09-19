import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemoryDatabaseRepository,
  DatabaseService,
} from "../server/index.js";

describe("Module 28: Database Migration, Backup & Disaster Recovery", () => {
  let repo: InMemoryDatabaseRepository;
  let service: DatabaseService;

  beforeEach(() => {
    repo = new InMemoryDatabaseRepository();
    service = new DatabaseService(repo, {
      targetRpoMinutes: 60,
      targetRtoMinutes: 120,
      retentionDays: 30,
      immutableLockEnabled: true,
      owner: "DBA Team",
    });
  });

  it("should detect destructive operations and block them unless override flag is set", async () => {
    const destructiveSql = "ALTER TABLE users DROP COLUMN legacy_phone; DROP TABLE temp_logs;";

    // 1. Safety check detects destructive operations
    const safety = service.analyzeMigrationSafety(destructiveSql, false);
    expect(safety.isDestructive).toBe(true);
    expect(safety.prohibitedOperations).toContain("DROP TABLE");
    expect(safety.prohibitedOperations).toContain("DROP COLUMN");
    expect(safety.requiresOverride).toBe(true);

    // 2. Applying without override flag should throw error
    await expect(
      service.applyMigration({
        name: "drop_legacy_columns",
        version: "002",
        sql: destructiveSql,
        allowDestructive: false,
      })
    ).rejects.toThrow("Migration rejected by safety checks");

    // 3. Applying with override flag should succeed
    const applied = await service.applyMigration({
      name: "drop_legacy_columns",
      version: "002",
      sql: destructiveSql,
      allowDestructive: true,
    });
    expect(applied.status).toBe("APPLIED");
  });

  it("should prevent concurrent migration runs via migration locking", async () => {
    // Acquire lock manually to simulate concurrent migration in progress
    await service.acquireMigrationLock();

    await expect(
      service.applyMigration({
        name: "create_items",
        version: "003",
        sql: "CREATE TABLE items (id UUID PRIMARY KEY);",
      })
    ).rejects.toThrow("another migration process is currently executing");

    // Release lock
    await service.releaseMigrationLock();

    // Now migration succeeds
    const applied = await service.applyMigration({
      name: "create_items",
      version: "003",
      sql: "CREATE TABLE items (id UUID PRIMARY KEY);",
    });
    expect(applied.status).toBe("APPLIED");
  });

  it("should record migration checksum and prevent duplicate version application", async () => {
    const sql = "CREATE TABLE audit_records (id UUID PRIMARY KEY);";

    const m1 = await service.applyMigration({
      name: "create_audit",
      version: "004",
      sql,
      rollbackSql: "DROP TABLE audit_records;",
    });

    expect(m1.checksum).toHaveLength(64); // SHA-256

    // Duplicate version
    await expect(
      service.applyMigration({
        name: "create_audit_again",
        version: "004",
        sql,
      })
    ).rejects.toThrow("has already been applied");
  });

  it("should rollback migration safely when rollbackSql is provided", async () => {
    await service.applyMigration({
      name: "create_temp",
      version: "005",
      sql: "CREATE TABLE temp (id INT);",
      rollbackSql: "DROP TABLE temp;",
    });

    const rolledBack = await service.rollbackMigration("005");
    expect(rolledBack.status).toBe("ROLLED_BACK");

    // Migration with no rollback SQL cannot be rolled back
    await service.applyMigration({
      name: "no_rollback_migration",
      version: "006",
      sql: "CREATE TABLE no_rollback (id INT);",
    });

    await expect(service.rollbackMigration("006")).rejects.toThrow(
      "cannot be safely rolled back: no rollback SQL provided"
    );
  });

  it("should create encrypted backups and execute restore drills with verification", async () => {
    const backup = await service.createBackup({
      backupType: "FULL_SNAPSHOT",
      sizeBytes: 104857600, // 100 MB
    });

    expect(backup.encrypted).toBe(true);
    expect(backup.status).toBe("COMPLETED");
    expect(backup.verifiedAt).toBeNull();

    // Run restore drill
    const drillResult = await service.verifyRestoreDrill(backup.id);
    expect(drillResult.success).toBe(true);

    const verifiedBackup = await repo.getBackupById(backup.id);
    expect(verifiedBackup?.status).toBe("VERIFIED");
    expect(verifiedBackup?.verifiedAt).toBeDefined();
  });

  it("should alert on stale backups exceeding target RPO", async () => {
    // Save a backup that is 2 hours old (target RPO is 60 minutes)
    await repo.saveBackup({
      id: "bk-old-1",
      backupType: "FULL_SNAPSHOT",
      status: "COMPLETED",
      sizeBytes: 50000000,
      storageLocation: "s3://backups/old.enc",
      encrypted: true,
      verifiedAt: null,
      rpoSeconds: 3600,
      createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    });

    const health = await service.checkBackupHealth();
    expect(health.healthy).toBe(false);
    expect(health.warnings.some((w) => w.includes("exceeding target RPO"))).toBe(true);
  });
});
