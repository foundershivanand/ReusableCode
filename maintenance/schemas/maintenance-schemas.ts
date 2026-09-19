import { z } from "zod";

export const MaintenanceModeSchema = z.enum([
  "OFF",
  "FULL_MAINTENANCE",
  "READ_ONLY",
  "DEGRADED",
]);
export type MaintenanceMode = z.infer<typeof MaintenanceModeSchema>;

export const MaintenanceScopeSchema = z.enum([
  "GLOBAL",
  "TENANT",
  "ROUTE",
  "FEATURE",
  "API_VERSION",
]);
export type MaintenanceScope = z.infer<typeof MaintenanceScopeSchema>;

export const BannerTypeSchema = z.enum([
  "INFO",
  "WARNING",
  "CRITICAL",
  "MAINTENANCE",
  "BREAKING_UPDATE",
]);
export type BannerType = z.infer<typeof BannerTypeSchema>;

export const MaintenanceConfigSchema = z.object({
  id: z.string().uuid(),
  mode: MaintenanceModeSchema.default("OFF"),
  scope: MaintenanceScopeSchema.default("GLOBAL"),
  target: z.string().default("*"), // tenantId, route regex/prefix, feature name, etc.
  title: z.string().min(1),
  message: z.string().min(1),
  adminBypassSecretHash: z.string().nullable().default(null),
  allowedRoles: z.array(z.string()).default(["admin", "superadmin"]),
  allowedUserIds: z.array(z.string()).default([]),
  allowedIps: z.array(z.string()).default([]),
  startsAt: z.string().datetime().default(() => new Date().toISOString()),
  endsAt: z.string().datetime().nullable().default(null),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type MaintenanceConfig = z.infer<typeof MaintenanceConfigSchema>;

export const SystemBannerSchema = z.object({
  id: z.string().uuid(),
  type: BannerTypeSchema.default("INFO"),
  title: z.string().min(1),
  message: z.string().min(1),
  actionUrl: z.string().url().optional(),
  actionLabel: z.string().optional(),
  dismissible: z.boolean().default(true),
  targetScope: z.enum(["ALL", "AUTHENTICATED", "GUEST"]).default("ALL"),
  startsAt: z.string().datetime().default(() => new Date().toISOString()),
  endsAt: z.string().datetime().nullable().default(null),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type SystemBanner = z.infer<typeof SystemBannerSchema>;

export const CheckMaintenanceInputSchema = z.object({
  path: z.string().default("/"),
  method: z.string().default("GET"),
  tenantId: z.string().optional(),
  userId: z.string().optional(),
  userRoles: z.array(z.string()).default([]),
  clientIp: z.string().optional(),
  bypassSecret: z.string().optional(),
  isApiRequest: z.boolean().default(false),
});
export type CheckMaintenanceInput = z.infer<typeof CheckMaintenanceInputSchema>;

export const CheckMaintenanceResultSchema = z.object({
  blocked: z.boolean(),
  readOnly: z.boolean(),
  reason: z.string().nullable(),
  publicMessage: z.string().nullable(),
  retryAfterSeconds: z.number().int().nonnegative().optional(),
  statusCode: z.number().int().default(200),
});
export type CheckMaintenanceResult = z.infer<typeof CheckMaintenanceResultSchema>;
