import { z } from "zod";

export const AdminRoleSchema = z.enum([
  "SUPER_ADMIN",
  "SUPPORT_ADMIN",
  "BILLING_ADMIN",
  "READONLY_ADMIN"
]);
export type AdminRole = z.infer<typeof AdminRoleSchema>;

export const AdminActionTypeSchema = z.enum([
  "USER_SUSPEND",
  "USER_ACTIVATE",
  "USER_DELETE",
  "USER_IMPERSONATE_START",
  "USER_IMPERSONATE_END",
  "ORGANIZATION_SUSPEND",
  "ORGANIZATION_DELETE",
  "PAYMENT_REFUND",
  "JOB_RETRY",
  "JOB_CANCEL",
  "FEATURE_FLAG_TOGGLE",
  "BREAK_GLASS_ACTIVATE",
  "SYSTEM_SETTING_UPDATE"
]);
export type AdminActionType = z.infer<typeof AdminActionTypeSchema>;

export const AdminUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  role: AdminRoleSchema,
  mfaEnforced: z.boolean().default(true),
  mfaVerified: z.boolean().default(false),
  isActive: z.boolean().default(true),
  lastLoginAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});
export type AdminUser = z.infer<typeof AdminUserSchema>;

export const AdminSessionSchema = z.object({
  id: z.string().min(1),
  adminId: z.string().min(1),
  tokenHash: z.string().min(1),
  ipAddress: z.string(),
  userAgent: z.string(),
  mfaVerifiedAt: z.date().optional(),
  lastActiveAt: z.date(),
  expiresAt: z.date(), // 15-minute inactivity or 8-hour absolute max
  createdAt: z.date(),
  revokedAt: z.date().optional()
});
export type AdminSession = z.infer<typeof AdminSessionSchema>;

export const AdminAuditLogSchema = z.object({
  id: z.string().min(1),
  adminId: z.string().min(1),
  adminEmail: z.string().email(),
  action: AdminActionTypeSchema,
  targetType: z.enum(["USER", "ORGANIZATION", "PAYMENT", "JOB", "SYSTEM", "FEATURE_FLAG"]),
  targetId: z.string().min(1),
  reason: z.string().min(5).max(500),
  ipAddress: z.string(),
  userAgent: z.string(),
  details: z.record(z.string(), z.any()).default({}),
  timestamp: z.date()
});
export type AdminAuditLog = z.infer<typeof AdminAuditLogSchema>;

export const BreakGlassEventSchema = z.object({
  id: z.string().min(1),
  adminId: z.string().min(1),
  reason: z.string().min(10).max(500),
  durationMinutes: z.number().int().min(5).max(120),
  activatedAt: z.date(),
  expiresAt: z.date(),
  revokedAt: z.date().optional()
});
export type BreakGlassEvent = z.infer<typeof BreakGlassEventSchema>;

export const DashboardStatsSchema = z.object({
  activeUsers: z.number().int().min(0),
  revenueMinorUnits: z.number().int().min(0),
  activeSubscriptions: z.number().int().min(0),
  errorCountLast24h: z.number().int().min(0),
  failedJobsCount: z.number().int().min(0),
  webhookFailuresLast24h: z.number().int().min(0)
});
export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

export const BulkActionInputSchema = z.object({
  action: AdminActionTypeSchema,
  targetIds: z.array(z.string().min(1)).min(1).max(100), // bounded batch size max 100
  reason: z.string().min(5).max(500)
});
export type BulkActionInput = z.infer<typeof BulkActionInputSchema>;
