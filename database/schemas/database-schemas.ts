import { z } from "zod";

export const MigrationStatusSchema = z.enum([
  "PENDING",
  "APPLIED",
  "ROLLED_BACK",
  "FAILED",
]);
export type MigrationStatus = z.infer<typeof MigrationStatusSchema>;

export const BackupStatusSchema = z.enum([
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
  "VERIFIED",
]);
export type BackupStatus = z.infer<typeof BackupStatusSchema>;

export const BackupTypeSchema = z.enum([
  "FULL_SNAPSHOT",
  "WAL_ARCHIVE",
  "LOGICAL_EXPORT",
]);
export type BackupType = z.infer<typeof BackupTypeSchema>;

export const MigrationRecordSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  version: z.string().min(1),
  checksum: z.string().min(1),
  appliedAt: z.string().datetime().default(() => new Date().toISOString()),
  executionTimeMs: z.number().int().nonnegative(),
  status: MigrationStatusSchema.default("APPLIED"),
  rollbackSql: z.string().nullable().default(null),
});
export type MigrationRecord = z.infer<typeof MigrationRecordSchema>;

export const BackupRecordSchema = z.object({
  id: z.string().uuid(),
  backupType: BackupTypeSchema.default("FULL_SNAPSHOT"),
  status: BackupStatusSchema.default("COMPLETED"),
  sizeBytes: z.number().int().nonnegative(),
  storageLocation: z.string().min(1),
  encrypted: z.boolean().default(true),
  verifiedAt: z.string().datetime().nullable().default(null),
  rpoSeconds: z.number().int().nonnegative().default(3600),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type BackupRecord = z.infer<typeof BackupRecordSchema>;

export const DisasterRecoveryConfigSchema = z.object({
  targetRpoMinutes: z.number().int().positive().default(60), // Max 1 hour data loss
  targetRtoMinutes: z.number().int().positive().default(120), // Max 2 hours to recover
  retentionDays: z.number().int().positive().default(30),
  immutableLockEnabled: z.boolean().default(true),
  owner: z.string().min(1).default("Database Reliability Engineering"),
});
export type DisasterRecoveryConfig = z.infer<typeof DisasterRecoveryConfigSchema>;

export const MigrationSafetyCheckResultSchema = z.object({
  isDestructive: z.boolean(),
  warnings: z.array(z.string()),
  prohibitedOperations: z.array(z.string()),
  requiresOverride: z.boolean(),
});
export type MigrationSafetyCheckResult = z.infer<typeof MigrationSafetyCheckResultSchema>;
