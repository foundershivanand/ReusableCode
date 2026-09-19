import { z } from "zod";

export const FindingSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type FindingSeverity = z.infer<typeof FindingSeveritySchema>;

export const FindingLifecycleStateSchema = z.enum([
  "OPEN",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "MITIGATED",
  "VERIFIED",
  "CLOSED",
]);
export type FindingLifecycleState = z.infer<typeof FindingLifecycleStateSchema>;

export const FindingCategorySchema = z.enum([
  "HEADERS",
  "COOKIES",
  "CORS",
  "AUTH",
  "ENV",
  "DEPENDENCIES",
]);
export type FindingCategory = z.infer<typeof FindingCategorySchema>;

export const SecurityEventTypeSchema = z.enum([
  "PRIVILEGED_LOGIN",
  "API_KEY_CREATED",
  "API_KEY_ROTATED",
  "MFA_DISABLED",
  "PASSWORD_CHANGED",
  "EMAIL_CHANGED",
  "OWNER_CHANGED",
  "FAILED_LOGIN_SPIKE",
  "RATE_LIMIT_EXCEEDED",
  "SUSPICIOUS_ACTIVITY",
  "SECRET_LEAK_DETECTED",
]);
export type SecurityEventType = z.infer<typeof SecurityEventTypeSchema>;

export const SecurityFindingSchema = z.object({
  id: z.string().uuid(),
  fingerprint: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  severity: FindingSeveritySchema,
  category: FindingCategorySchema,
  remediationGuidance: z.string().min(1),
  state: FindingLifecycleStateSchema.default("OPEN"),
  suppressed: z.boolean().default(false),
  suppressionReason: z.string().nullable().default(null),
  suppressionOwner: z.string().nullable().default(null),
  suppressionExpiresAt: z.string().datetime().nullable().default(null),
  approvedBy: z.string().nullable().default(null),
  firstDetectedAt: z.string().datetime().default(() => new Date().toISOString()),
  lastDetectedAt: z.string().datetime().default(() => new Date().toISOString()),
  resolvedAt: z.string().datetime().nullable().default(null),
});
export type SecurityFinding = z.infer<typeof SecurityFindingSchema>;

export const SecurityEventSchema = z.object({
  id: z.string().uuid(),
  eventType: SecurityEventTypeSchema,
  severity: FindingSeveritySchema,
  actorId: z.string().min(1),
  ipAddress: z.string().min(1),
  userAgent: z.string().default("Unknown"),
  details: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type SecurityEvent = z.infer<typeof SecurityEventSchema>;

export const SecurityPostureScoreSchema = z.object({
  overallScore: z.number().min(0).max(100),
  grade: z.enum(["A", "B", "C", "D", "F"]),
  totalFindings: z.number().int().nonnegative(),
  criticalCount: z.number().int().nonnegative(),
  highCount: z.number().int().nonnegative(),
  mediumCount: z.number().int().nonnegative(),
  lowCount: z.number().int().nonnegative(),
  mfaAdoptionPercent: z.number().min(0).max(100),
  timestamp: z.string().datetime().default(() => new Date().toISOString()),
});
export type SecurityPostureScore = z.infer<typeof SecurityPostureScoreSchema>;

export const SuppressionInputSchema = z.object({
  findingId: z.string().uuid(),
  reason: z.string().min(10, "Suppression reason must be at least 10 characters"),
  owner: z.string().min(1),
  expirationDays: z.number().int().positive().default(90),
  approvedBy: z.string().min(1),
});
export type SuppressionInput = z.infer<typeof SuppressionInputSchema>;
