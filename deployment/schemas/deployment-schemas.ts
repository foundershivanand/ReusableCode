import { z } from "zod";

export const AppEnvironmentSchema = z.enum([
  "development",
  "preview",
  "staging",
  "production",
]);
export type AppEnvironment = z.infer<typeof AppEnvironmentSchema>;

export const DeploymentGateStatusSchema = z.enum([
  "PENDING",
  "RUNNING",
  "PASSED",
  "FAILED",
  "BYPASSED",
]);
export type DeploymentGateStatus = z.infer<typeof DeploymentGateStatusSchema>;

export const DeploymentMetadataSchema = z.object({
  version: z.string().min(1),
  commitSha: z.string().min(7),
  buildTimestamp: z.string().datetime(),
  environment: AppEnvironmentSchema,
  runtime: z.string().min(1), // e.g. "Node.js v22.12.0 (linux x64)"
  databaseVersion: z.string().default("PostgreSQL 16.2"),
  deployedAt: z.string().datetime().default(() => new Date().toISOString()),
  deployedBy: z.string().default("CI/CD Pipeline"),
});
export type DeploymentMetadata = z.infer<typeof DeploymentMetadataSchema>;

export const ServerEnvConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url(),
  APP_SECRET: z.string().min(32, "APP_SECRET must be at least 32 characters for security"),
  PREVIOUS_APP_SECRET: z.string().min(32).optional(),
  REDIS_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});
export type ServerEnvConfig = z.infer<typeof ServerEnvConfigSchema>;

export const SanitizedConfigItemSchema = z.object({
  key: z.string(),
  isSecret: z.boolean(),
  maskedValue: z.string(),
  source: z.enum(["ENV", "DEFAULT"]),
  description: z.string().optional(),
});
export type SanitizedConfigItem = z.infer<typeof SanitizedConfigItemSchema>;

export const ConfigDriftFindingSchema = z.object({
  key: z.string(),
  expectedType: z.string(),
  actualStatus: z.enum(["MISSING", "INVALID_FORMAT", "UNEXPECTED", "MATCH"]),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
  message: z.string(),
});
export type ConfigDriftFinding = z.infer<typeof ConfigDriftFindingSchema>;

export const DeploymentGateReportSchema = z.object({
  deploymentId: z.string().uuid(),
  version: z.string(),
  commitSha: z.string(),
  environment: AppEnvironmentSchema,
  gates: z.object({
    tests: DeploymentGateStatusSchema,
    typecheck: DeploymentGateStatusSchema,
    build: DeploymentGateStatusSchema,
    migrationCheck: DeploymentGateStatusSchema,
    securityCheck: DeploymentGateStatusSchema,
    approval: DeploymentGateStatusSchema,
  }),
  canDeploy: z.boolean(),
});
export type DeploymentGateReport = z.infer<typeof DeploymentGateReportSchema>;
