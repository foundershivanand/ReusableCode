import { z } from "zod";

export const HealthStatusSchema = z.enum(["HEALTHY", "DEGRADED", "UNHEALTHY"]);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const IncidentSeveritySchema = z.enum([
  "SEV1_CRITICAL",
  "SEV2_MAJOR",
  "SEV3_MINOR",
  "SEV4_LOW",
]);
export type IncidentSeverity = z.infer<typeof IncidentSeveritySchema>;

export const IncidentStateSchema = z.enum([
  "DETECTED",
  "ACKNOWLEDGED",
  "INVESTIGATING",
  "MITIGATED",
  "RESOLVED",
  "POSTMORTEM",
]);
export type IncidentState = z.infer<typeof IncidentStateSchema>;

export const ComponentTypeSchema = z.enum([
  "API",
  "DATABASE",
  "CACHE",
  "QUEUE",
  "PAYMENTS",
  "AI_PROVIDER",
  "WEBHOOKS",
]);
export type ComponentType = z.infer<typeof ComponentTypeSchema>;

export const DependencyCheckResultSchema = z.object({
  name: z.string().min(1),
  type: ComponentTypeSchema,
  status: HealthStatusSchema,
  latencyMs: z.number().nonnegative(),
  message: z.string().nullable().default(null),
  isCritical: z.boolean().default(true),
  lastCheckedAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type DependencyCheckResult = z.infer<typeof DependencyCheckResultSchema>;

export const SystemHealthReportSchema = z.object({
  status: HealthStatusSchema,
  liveness: z.boolean(),
  readiness: z.boolean(),
  timestamp: z.string().datetime().default(() => new Date().toISOString()),
  dependencies: z.array(DependencyCheckResultSchema),
  metrics: z.object({
    uptimeSeconds: z.number().nonnegative(),
    avgLatencyMs: z.number().nonnegative(),
    errorRatePercent: z.number().nonnegative(),
  }),
});
export type SystemHealthReport = z.infer<typeof SystemHealthReportSchema>;

export const IncidentUpdateSchema = z.object({
  id: z.string().uuid(),
  incidentId: z.string().uuid(),
  state: IncidentStateSchema,
  message: z.string().min(1),
  author: z.string().min(1),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type IncidentUpdate = z.infer<typeof IncidentUpdateSchema>;

export const PostmortemSchema = z.object({
  impact: z.string().min(1),
  timeline: z.array(z.string()).default([]),
  rootCauses: z.array(z.string()).default([]),
  remediation: z.array(z.string()).default([]),
});
export type Postmortem = z.infer<typeof PostmortemSchema>;

export const IncidentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  severity: IncidentSeveritySchema,
  state: IncidentStateSchema.default("DETECTED"),
  affectedComponents: z.array(ComponentTypeSchema),
  summary: z.string().min(1),
  publicMessage: z.string().min(1),
  runbookUrl: z.string().url().nullable().default(null),
  startedAt: z.string().datetime().default(() => new Date().toISOString()),
  mitigatedAt: z.string().datetime().nullable().default(null),
  resolvedAt: z.string().datetime().nullable().default(null),
  updates: z.array(IncidentUpdateSchema).default([]),
  postmortem: PostmortemSchema.nullable().default(null),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type Incident = z.infer<typeof IncidentSchema>;

export const SloDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  targetPercentage: z.number().min(0).max(100),
  currentPercentage: z.number().min(0).max(100),
  periodDays: z.number().int().positive().default(30),
  status: z.enum(["MET", "AT_RISK", "BREACHED"]),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type SloDefinition = z.infer<typeof SloDefinitionSchema>;

export const AlertEventSchema = z.object({
  id: z.string().uuid(),
  fingerprint: z.string().min(1),
  severity: IncidentSeveritySchema,
  component: ComponentTypeSchema,
  message: z.string().min(1),
  incidentId: z.string().uuid().nullable().default(null),
  suppressed: z.boolean().default(false),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type AlertEvent = z.infer<typeof AlertEventSchema>;
