import { z } from "zod";

export const FlagLifecycleStateSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "DEPRECATED",
  "EXPIRED"
]);
export type FlagLifecycleState = z.infer<typeof FlagLifecycleStateSchema>;

export const FlagTargetingRuleSchema = z.object({
  attribute: z.enum(["userId", "organizationId", "tenantId", "role", "plan", "environment", "email"]),
  operator: z.enum(["EQUALS", "IN", "NOT_IN", "CONTAINS", "GREATER_THAN", "LESS_THAN"]),
  values: z.array(z.string())
});
export type FlagTargetingRule = z.infer<typeof FlagTargetingRuleSchema>;

export const FeatureFlagSchema = z.object({
  key: z.string().min(1).regex(/^[a-z0-9_-]+$/),
  name: z.string().min(1),
  description: z.string().default(""),
  enabled: z.boolean().default(false),
  isKillSwitch: z.boolean().default(false), // when true, emergency shutdown flag
  failClosed: z.boolean().default(true), // if unavailable or error, fail closed
  percentageRollout: z.number().min(0).max(100).default(0),
  targetingRules: z.array(FlagTargetingRuleSchema).default([]),
  dependencies: z.array(z.string()).default([]), // flags that must also be enabled
  remoteConfigSchema: z.record(z.string(), z.any()).optional(), // JSON schema for remote config payload
  remoteConfigValue: z.record(z.string(), z.any()).optional(),
  owner: z.string().min(1),
  lifecycleState: FlagLifecycleStateSchema.default("ACTIVE"),
  expiresAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});
export type FeatureFlag = z.infer<typeof FeatureFlagSchema>;

export const EvaluationContextSchema = z.object({
  userId: z.string().optional(),
  tenantId: z.string().optional(),
  organizationId: z.string().optional(),
  role: z.string().optional(),
  plan: z.string().optional(),
  environment: z.string().default("production"),
  attributes: z.record(z.string(), z.any()).default({})
});
export type EvaluationContext = z.infer<typeof EvaluationContextSchema>;

export const EvaluationResultSchema = z.object({
  key: z.string(),
  enabled: z.boolean(),
  reason: z.string(),
  remoteConfig: z.record(z.string(), z.any()).optional(),
  isDefault: z.boolean().default(false)
});
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

export const FlagAuditEntrySchema = z.object({
  id: z.string(),
  flagKey: z.string(),
  action: z.enum(["CREATE", "UPDATE", "TOGGLE", "ROLLOUT_CHANGE", "DELETE"]),
  actor: z.string(),
  previousState: z.any().optional(),
  newState: z.any().optional(),
  timestamp: z.date().default(() => new Date())
});
export type FlagAuditEntry = z.infer<typeof FlagAuditEntrySchema>;
