import { z } from "zod";

export const NotificationChannelSchema = z.enum(["EMAIL", "IN_APP", "PUSH", "WEBHOOK"]);
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

export const NotificationPrioritySchema = z.enum(["HIGH", "DEFAULT", "LOW"]);
export type NotificationPriority = z.infer<typeof NotificationPrioritySchema>;

export const NotificationCategorySchema = z.enum(["TRANSACTIONAL", "MARKETING", "SECURITY", "LEGAL"]);
export type NotificationCategory = z.infer<typeof NotificationCategorySchema>;

export const NotificationStatusSchema = z.enum([
  "QUEUED",
  "PROCESSING",
  "SENT",
  "DELIVERED",
  "BOUNCED",
  "FAILED",
  "COMPLAINED",
  "CANCELED"
]);
export type NotificationStatus = z.infer<typeof NotificationStatusSchema>;

export const NotificationTemplateSchema = z.enum([
  "welcome_email",
  "verification_email",
  "password_reset",
  "magic_link",
  "invoice_receipt",
  "payment_failed",
  "subscription_updated",
  "system_alert"
]);
export type NotificationTemplate = z.infer<typeof NotificationTemplateSchema>;

export const NotificationPayloadSchema = z.object({
  userId: z.string().min(1),
  tenantId: z.string().optional(),
  recipientAddress: z.string().min(1), // email address, push token, or webhook url
  channel: NotificationChannelSchema,
  template: NotificationTemplateSchema,
  category: NotificationCategorySchema,
  data: z.record(z.string(), z.any()),
  priority: NotificationPrioritySchema.optional().default("DEFAULT"),
  idempotencyKey: z.string().min(1).optional(),
  locale: z.string().optional().default("en"),
  timezone: z.string().optional().default("UTC"),
  scheduledAt: z.date().optional()
});
export type NotificationPayload = z.output<typeof NotificationPayloadSchema>;
export type NotificationInput = z.input<typeof NotificationPayloadSchema>;

export const NotificationRecordSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  tenantId: z.string().optional(),
  recipientAddress: z.string().min(1),
  channel: NotificationChannelSchema,
  template: NotificationTemplateSchema,
  category: NotificationCategorySchema,
  data: z.record(z.string(), z.any()),
  priority: NotificationPrioritySchema,
  status: NotificationStatusSchema,
  idempotencyKey: z.string().optional(),
  provider: z.string().optional(),
  attempts: z.number().int().min(0),
  maxAttempts: z.number().int().min(1),
  lastError: z.string().optional(),
  readAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deliveredAt: z.date().optional()
});
export type NotificationRecord = z.infer<typeof NotificationRecordSchema>;

export const NotificationPreferencesSchema = z.object({
  userId: z.string().min(1),
  emailNotifications: z.boolean().default(true),
  inAppNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  marketingEmails: z.boolean().default(false), // opt-in / unsubscribe
  digestMode: z.boolean().default(false),
  digestFrequency: z.enum(["DAILY", "WEEKLY"]).default("DAILY"),
  locale: z.string().default("en"),
  timezone: z.string().default("UTC")
});
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

export const SuppressionRecordSchema = z.object({
  recipientAddress: z.string().min(1),
  channel: NotificationChannelSchema,
  reason: z.enum(["HARD_BOUNCE", "SPAM_COMPLAINT", "MANUAL_SUPPRESSION"]),
  suppressedAt: z.date()
});
export type SuppressionRecord = z.infer<typeof SuppressionRecordSchema>;
