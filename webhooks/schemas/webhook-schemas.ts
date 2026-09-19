import { z } from "zod";

export const ApiKeyLifecycleStateSchema = z.enum([
  "CREATED",
  "ACTIVE",
  "ROTATED",
  "REVOKED",
  "EXPIRED"
]);
export type ApiKeyLifecycleState = z.infer<typeof ApiKeyLifecycleStateSchema>;

export const ApiKeySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1),
  prefix: z.string().min(4), // Non-secret identifier, e.g. "pk_live_7a8b"
  keyHash: z.string().min(64), // SHA-256 hash at rest; NEVER store plaintext
  scopes: z.array(z.string()).min(1),
  rateLimitPerMinute: z.number().int().min(1).default(60),
  lifecycleState: ApiKeyLifecycleStateSchema.default("ACTIVE"),
  expiresAt: z.date().optional(),
  lastUsedAt: z.date().optional(),
  lastUsedIp: z.string().optional(),
  lastUsedUserAgent: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});
export type ApiKey = z.infer<typeof ApiKeySchema>;

export const CreateApiKeyInputSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1),
  scopes: z.array(z.string()).min(1),
  expiresInDays: z.number().int().min(1).max(365).optional(),
  rateLimitPerMinute: z.number().int().min(1).default(60)
});
export type CreateApiKeyInput = z.infer<typeof CreateApiKeyInputSchema>;

export const WebhookStatusSchema = z.enum(["ACTIVE", "DISABLED", "SUSPENDED", "DEAD_LETTER"]);
export type WebhookStatus = z.infer<typeof WebhookStatusSchema>;

export const WebhookEndpointSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  url: z.string().url(),
  description: z.string().optional(),
  eventTypes: z.array(z.string()).min(1), // e.g. ["user.created", "invoice.paid"]
  secret: z.string().min(16), // HMAC shared secret
  previousSecret: z.string().optional(), // For secret rotation grace period
  status: WebhookStatusSchema.default("ACTIVE"),
  schemaVersion: z.string().default("v1"),
  ownershipVerified: z.boolean().default(false),
  consecutiveFailures: z.number().int().default(0),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});
export type WebhookEndpoint = z.infer<typeof WebhookEndpointSchema>;

export const DeliveryAttemptStatusSchema = z.enum([
  "SUCCESS",
  "RETRYABLE_FAILURE",
  "NON_RETRYABLE_FAILURE",
  "TIMEOUT",
  "DEAD_LETTER"
]);
export type DeliveryAttemptStatus = z.infer<typeof DeliveryAttemptStatusSchema>;

export const WebhookDeliveryLogSchema = z.object({
  id: z.string().min(1),
  endpointId: z.string().min(1),
  tenantId: z.string().min(1),
  eventId: z.string().min(1),
  eventType: z.string().min(1),
  payload: z.record(z.string(), z.any()),
  attemptNumber: z.number().int().min(1),
  statusCode: z.number().int().optional(),
  status: DeliveryAttemptStatusSchema,
  responseBody: z.string().optional(),
  errorMessage: z.string().optional(),
  durationMs: z.number().min(0),
  timestamp: z.date().default(() => new Date())
});
export type WebhookDeliveryLog = z.infer<typeof WebhookDeliveryLogSchema>;
