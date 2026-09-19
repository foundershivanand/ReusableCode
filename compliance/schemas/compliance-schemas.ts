import { z } from "zod";

export const DataSubjectRequestTypeSchema = z.enum([
  "ACCESS",
  "EXPORT",
  "CORRECTION",
  "DELETION",
  "RESTRICTION"
]);
export type DataSubjectRequestType = z.infer<typeof DataSubjectRequestTypeSchema>;

export const DsrStatusSchema = z.enum([
  "SUBMITTED",
  "VERIFYING_IDENTITY",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
  "HELD_UNDER_LEGAL_HOLD"
]);
export type DsrStatus = z.infer<typeof DsrStatusSchema>;

export const ConsentEvidenceSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  tenantId: z.string().min(1),
  termsVersion: z.string().min(1), // e.g. "2026.1"
  privacyVersion: z.string().min(1),
  acceptedTerms: z.boolean(),
  acceptedPrivacy: z.boolean(),
  marketingConsent: z.boolean().default(false),
  cookieConsent: z
    .object({
      essential: z.boolean().default(true),
      analytics: z.boolean().default(false),
      marketing: z.boolean().default(false),
      functional: z.boolean().default(false)
    })
    .default({ essential: true, analytics: false, marketing: false, functional: false }),
  acceptedAt: z.date().default(() => new Date()),
  acceptedIp: z.string().optional(),
  userAgent: z.string().optional(),
  jurisdiction: z.string().default("US"), // e.g. "US", "EU", "CA", "UK"
  immutableHash: z.string().optional()
});
export type ConsentEvidence = z.infer<typeof ConsentEvidenceSchema>;

export const DataSubjectRequestSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  tenantId: z.string().min(1),
  userEmail: z.string().email(),
  type: DataSubjectRequestTypeSchema,
  status: DsrStatusSchema.default("SUBMITTED"),
  reason: z.string().optional(),
  identityVerified: z.boolean().default(false),
  verificationToken: z.string().optional(),
  submittedAt: z.date().default(() => new Date()),
  completedAt: z.date().optional(),
  rejectionReason: z.string().optional(),
  resultDownloadUrl: z.string().optional(),
  downloadExpiresAt: z.date().optional()
});
export type DataSubjectRequest = z.infer<typeof DataSubjectRequestSchema>;

export const RetentionPolicySchema = z.object({
  category: z.string().min(1), // e.g. "AUDIT_LOGS", "PAYMENT_RECORDS", "SUPPORT_TICKETS", "USER_SESSIONS"
  retentionPeriodDays: z.number().int().min(1),
  legalHoldExempt: z.boolean().default(true),
  autoPurge: z.boolean().default(false),
  description: z.string()
});
export type RetentionPolicy = z.infer<typeof RetentionPolicySchema>;

export const VendorProcessorSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1), // e.g. "PAYMENT", "HOSTING", "ANALYTICS", "AI"
  purposes: z.array(z.string()).min(1),
  dataCategories: z.array(z.string()).min(1),
  region: z.string().min(1), // e.g. "US", "EU", "GLOBAL"
  dpaSigned: z.boolean().default(false)
});
export type VendorProcessor = z.infer<typeof VendorProcessorSchema>;
