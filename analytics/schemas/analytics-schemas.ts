import { z } from "zod";

export const PiiClassificationSchema = z.enum([
  "PUBLIC",
  "INTERNAL",
  "PERSONAL",
  "SENSITIVE",
  "SECRET"
]);
export type PiiClassification = z.infer<typeof PiiClassificationSchema>;

export const AnalyticsEventSchema = z.object({
  id: z.string().min(1),
  eventVersion: z.string().regex(/^[a-z0-9._-]+\.v[0-9]+$/), // e.g. "project.created.v2"
  eventName: z.string().min(1).max(100),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  properties: z.record(z.string(), z.any()).default({}),
  timestamp: z.date(),
  idempotencyKey: z.string().optional(),
  clientTimestamp: z.date().optional()
});
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

export const TrackEventInputSchema = z.object({
  eventVersion: z.string().regex(/^[a-z0-9._-]+\.v[0-9]+$/, "Event name must be versioned (e.g. user.signed_up.v1)"),
  eventName: z.string().min(1).max(100),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  properties: z.record(z.string(), z.any()).optional().default({}),
  idempotencyKey: z.string().optional(),
  consentGiven: z.boolean().default(false)
});
export type TrackEventInput = z.infer<typeof TrackEventInputSchema>;

export const LogLevelSchema = z.enum(["DEBUG", "INFO", "WARN", "ERROR"]);
export type LogLevel = z.infer<typeof LogLevelSchema>;

export const LogContextSchema = z.object({
  requestId: z.string().optional(),
  traceId: z.string().optional(),
  userId: z.string().optional(),
  tenantId: z.string().optional(),
  service: z.string().optional().default("api"),
  environment: z.string().optional().default("production"),
  errorCode: z.string().optional(),
  extra: z.record(z.string(), z.any()).optional()
});
export type LogContext = z.output<typeof LogContextSchema>;
export type LogContextInput = z.input<typeof LogContextSchema>;

export const LogEntrySchema = z.object({
  id: z.string().min(1),
  level: LogLevelSchema,
  message: z.string().min(1),
  context: LogContextSchema,
  timestamp: z.date(),
  errorStack: z.string().optional()
});
export type LogEntry = z.infer<typeof LogEntrySchema>;
