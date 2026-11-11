import { z } from "zod";

export const ActorTypeSchema = z.enum([
  "USER",
  "ADMIN",
  "SYSTEM",
  "WORKER",
  "API_KEY",
  "WEBHOOK",
  "AI_AGENT"
]);
export type ActorType = z.infer<typeof ActorTypeSchema>;

export const AuditActorSchema = z.object({
  id: z.string().min(1),
  type: ActorTypeSchema,
  email: z.string().optional(),
  name: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  impersonator: z
    .object({
      id: z.string(),
      email: z.string().optional(),
      reason: z.string()
    })
    .optional()
});
export type AuditActor = z.infer<typeof AuditActorSchema>;

export const AuditActionSchema = z.enum([
  "LOGIN",
  "LOGOUT",
  "PASSWORD_CHANGED",
  "PLAN_CHANGED",
  "PROJECT_CREATED",
  "PROJECT_DELETED",
  "MEMBER_INVITED",
  "API_KEY_CREATED",
  "API_KEY_REVOKED",
  "ADMIN_IMPERSONATION",
  "ROLE_CHANGED",
  "SETTINGS_UPDATED",
  "FEATURE_FLAG_TOGGLED",
  "DATA_EXPORT_REQUESTED",
  "DATA_DELETION_REQUESTED",
  "CUSTOM_ACTION"
]);
export type AuditAction = z.infer<typeof AuditActionSchema>;

export const AuditTargetSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  name: z.string().optional()
});
export type AuditTarget = z.infer<typeof AuditTargetSchema>;

export const AuditLogEntrySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  actor: AuditActorSchema,
  action: z.string().min(1),
  target: AuditTargetSchema,
  requestId: z.string().min(1),
  timestamp: z.date().default(() => new Date()),
  beforeState: z.record(z.string(), z.any()).optional(),
  afterState: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  hash: z.string().optional(), // cryptographic hash for tamper resistance
  previousHash: z.string().optional() // hash chaining
});
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

export const CreateAuditLogInputSchema = z.object({
  tenantId: z.string().min(1),
  actor: AuditActorSchema,
  action: z.string().min(1),
  target: AuditTargetSchema,
  requestId: z.string().optional(),
  beforeState: z.record(z.string(), z.any()).optional(),
  afterState: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).default({})
});
export type CreateAuditLogInput = z.input<typeof CreateAuditLogInputSchema>;

export const AuditQueryFilterSchema = z.object({
  tenantId: z.string().min(1),
  actorId: z.string().optional(),
  actorType: ActorTypeSchema.optional(),
  action: z.string().optional(),
  targetType: z.string().optional(),
  targetId: z.string().optional(),
  fromDate: z.date().optional(),
  toDate: z.date().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  cursor: z.string().optional()
});
export type AuditQueryFilter = z.infer<typeof AuditQueryFilterSchema>;
