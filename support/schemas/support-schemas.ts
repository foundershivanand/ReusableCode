import { z } from "zod";

export const TicketStatusSchema = z.enum([
  "CREATED",
  "ASSIGNED",
  "FIRST_RESPONSE",
  "PENDING_CUSTOMER",
  "RESOLVED",
  "REOPENED"
]);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

export const TicketPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;

export const TicketTypeSchema = z.enum([
  "FEEDBACK",
  "BUG_REPORT",
  "FEATURE_REQUEST",
  "CONTACT_SUPPORT"
]);
export type TicketType = z.infer<typeof TicketTypeSchema>;

export const BrowserMetadataSchema = z.object({
  browser: z.string().optional(),
  os: z.string().optional(),
  viewport: z.string().optional(),
  url: z.string().min(1),
  userAgent: z.string().optional(),
  language: z.string().optional()
});
export type BrowserMetadata = z.infer<typeof BrowserMetadataSchema>;

export const SupportAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  sizeBytes: z.number().max(10 * 1024 * 1024), // 10MB limit
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "application/pdf", "text/plain"]),
  url: z.string().url()
});
export type SupportAttachment = z.infer<typeof SupportAttachmentSchema>;

export const SupportTicketSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().email(),
  type: TicketTypeSchema,
  status: TicketStatusSchema.default("CREATED"),
  priority: TicketPrioritySchema.default("MEDIUM"),
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  assignedTo: z.string().optional(),
  browserMetadata: BrowserMetadataSchema.optional(),
  attachments: z.array(SupportAttachmentSchema).default([]),
  contentHash: z.string().optional(), // For duplicate detection
  isLegalHold: z.boolean().default(false),
  verifiedIdentity: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  firstResponseAt: z.date().optional(),
  resolvedAt: z.date().optional()
});
export type SupportTicket = z.infer<typeof SupportTicketSchema>;

export const CreateTicketInputSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().email(),
  type: TicketTypeSchema,
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  browserMetadata: BrowserMetadataSchema.optional(),
  attachments: z.array(SupportAttachmentSchema).default([])
});
export type CreateTicketInput = z.infer<typeof CreateTicketInputSchema>;

export const ImpersonationSessionSchema = z.object({
  id: z.string(),
  adminId: z.string(),
  targetUserId: z.string(),
  tenantId: z.string(),
  reason: z.string().min(5),
  expiresAt: z.date(),
  createdAt: z.date().default(() => new Date()),
  revoked: z.boolean().default(false)
});
export type ImpersonationSession = z.infer<typeof ImpersonationSessionSchema>;
