import { z } from "zod";

export const DomainStatusSchema = z.enum([
  "REQUESTED",
  "VERIFYING",
  "VERIFIED",
  "ACTIVE",
  "FAILED",
  "DISABLED",
]);
export type DomainStatus = z.infer<typeof DomainStatusSchema>;

export const SslStatusSchema = z.enum([
  "PENDING_ISSUANCE",
  "ISSUED",
  "RENEWING",
  "FAILED",
  "REVOKED",
]);
export type SslStatus = z.infer<typeof SslStatusSchema>;

export const DnsChallengeSchema = z.object({
  recordType: z.enum(["CNAME", "TXT", "A"]),
  name: z.string().min(1),
  expectedValue: z.string().min(1),
});
export type DnsChallenge = z.infer<typeof DnsChallengeSchema>;

export const CustomDomainSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().min(1),
  domain: z.string().regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid domain format"),
  status: DomainStatusSchema.default("REQUESTED"),
  sslStatus: SslStatusSchema.default("PENDING_ISSUANCE"),
  verificationToken: z.string().min(1),
  dnsChallenges: z.array(DnsChallengeSchema).default([]),
  verifiedAt: z.string().datetime().nullable().default(null),
  sslExpiresAt: z.string().datetime().nullable().default(null),
  lastCheckedAt: z.string().datetime().nullable().default(null),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type CustomDomain = z.infer<typeof CustomDomainSchema>;

export const TenantBrandingSchema = z.object({
  tenantId: z.string().min(1),
  companyName: z.string().min(1),
  logoUrl: z.string().url().nullable().default(null),
  darkLogoUrl: z.string().url().nullable().default(null),
  faviconUrl: z.string().url().nullable().default(null),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default("#2563eb"),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default("#3b82f6"),
  supportEmail: z.string().email().nullable().default(null),
  senderEmailDomain: z.string().nullable().default(null),
  senderEmailVerified: z.boolean().default(false),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type TenantBranding = z.infer<typeof TenantBrandingSchema>;

export const RequestDomainInputSchema = z.object({
  tenantId: z.string().min(1),
  domain: z.string().regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid domain format"),
});
export type RequestDomainInput = z.infer<typeof RequestDomainInputSchema>;

export const UpdateBrandingInputSchema = z.object({
  tenantId: z.string().min(1),
  companyName: z.string().min(1).optional(),
  logoUrl: z.string().url().nullable().optional(),
  darkLogoUrl: z.string().url().nullable().optional(),
  faviconUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  supportEmail: z.string().email().nullable().optional(),
  senderEmailDomain: z.string().nullable().optional(),
});
export type UpdateBrandingInput = z.infer<typeof UpdateBrandingInputSchema>;
