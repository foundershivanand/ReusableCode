import { z } from "zod";

export const AttributionModelSchema = z.enum([
  "FIRST_TOUCH",
  "LAST_TOUCH",
  "SIGNUP_TIME",
  "CONVERSION_TIME",
  "COUPON"
]);
export type AttributionModel = z.infer<typeof AttributionModelSchema>;

export const CommissionStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "PAYABLE",
  "PAID",
  "REVERSED",
  "DISPUTED"
]);
export type CommissionStatus = z.infer<typeof CommissionStatusSchema>;

export const AffiliateAccountSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  referralCode: z.string().min(3).regex(/^[a-zA-Z0-9_-]+$/),
  commissionRatePercent: z.number().min(0).max(100).default(20),
  payoutEmail: z.string().email(),
  payoutMethod: z.enum(["PAYPAL", "STRIPE", "WISE", "MANUAL"]).default("STRIPE"),
  isVerified: z.boolean().default(false),
  requiresMfaForPayoutChange: z.boolean().default(true),
  totalEarnedCents: z.number().int().min(0).default(0),
  totalPaidCents: z.number().int().min(0).default(0),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});
export type AffiliateAccount = z.infer<typeof AffiliateAccountSchema>;

export const ReferralAttributionSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  affiliateId: z.string().min(1),
  referralCode: z.string().min(1),
  referredUserId: z.string().optional(),
  visitorIp: z.string().optional(),
  deviceFingerprint: z.string().optional(),
  paymentMethodFingerprint: z.string().optional(),
  attributionModel: AttributionModelSchema.default("LAST_TOUCH"),
  attributedAt: z.date().default(() => new Date()),
  expiresAt: z.date(),
  isFlaggedFraud: z.boolean().default(false),
  fraudReason: z.string().optional()
});
export type ReferralAttribution = z.infer<typeof ReferralAttributionSchema>;

export const CommissionLedgerEntrySchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  affiliateId: z.string().min(1),
  attributionId: z.string().min(1),
  paymentId: z.string().min(1),
  amountCents: z.number().int().min(0),
  commissionCents: z.number().int().min(0),
  currency: z.string().default("USD"),
  status: CommissionStatusSchema.default("PENDING"),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  approvedAt: z.date().optional(),
  paidAt: z.date().optional(),
  reversedAt: z.date().optional()
});
export type CommissionLedgerEntry = z.infer<typeof CommissionLedgerEntrySchema>;

export const CreateAffiliateInputSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  referralCode: z.string().min(3).regex(/^[a-zA-Z0-9_-]+$/),
  payoutEmail: z.string().email(),
  commissionRatePercent: z.number().min(0).max(100).default(20)
});
export type CreateAffiliateInput = z.infer<typeof CreateAffiliateInputSchema>;

export const RecordAttributionInputSchema = z.object({
  tenantId: z.string().min(1),
  referralCode: z.string().min(1),
  referredUserId: z.string().optional(),
  visitorIp: z.string().optional(),
  deviceFingerprint: z.string().optional(),
  paymentMethodFingerprint: z.string().optional()
});
export type RecordAttributionInput = z.infer<typeof RecordAttributionInputSchema>;
