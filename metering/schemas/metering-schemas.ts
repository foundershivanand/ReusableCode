import { z } from "zod";

export const LedgerEntryTypeSchema = z.enum([
  "CREDIT_PURCHASE",
  "CREDIT_EXPIRATION",
  "USAGE_DEBIT",
  "RESERVATION_HOLD",
  "RESERVATION_SETTLE",
  "RESERVATION_RELEASE",
  "ADMIN_CORRECTION",
  "AUTO_RECHARGE",
  "REFUND",
]);
export type LedgerEntryType = z.infer<typeof LedgerEntryTypeSchema>;

export const ReservationStatusSchema = z.enum([
  "PENDING",
  "SETTLED",
  "RELEASED",
  "EXPIRED",
]);
export type ReservationStatus = z.infer<typeof ReservationStatusSchema>;

export const CreditBalanceSchema = z.object({
  tenantId: z.string().min(1),
  availableBalance: z.number(),
  reservedBalance: z.number().nonnegative(),
  lifetimePurchased: z.number().nonnegative(),
  lifetimeConsumed: z.number().nonnegative(),
  currency: z.string().default("CREDITS"),
  version: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
});
export type CreditBalance = z.infer<typeof CreditBalanceSchema>;

export const CreditGrantSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().min(1),
  amount: z.number().positive(),
  remainingAmount: z.number().nonnegative(),
  expiresAt: z.string().datetime().nullable(),
  priority: z.number().int().default(0), // Lower numbers consumed first
  createdAt: z.string().datetime(),
});
export type CreditGrant = z.infer<typeof CreditGrantSchema>;

export const LedgerEntrySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().min(1),
  entryType: LedgerEntryTypeSchema,
  amount: z.number(), // Positive for credits, negative for debits
  balanceAfter: z.number(),
  idempotencyKey: z.string().min(1).optional(),
  reservationId: z.string().uuid().optional(),
  pricingVersion: z.string().default("v1"),
  reason: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
});
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

export const ReservationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().min(1),
  operationId: z.string().min(1),
  estimatedAmount: z.number().positive(),
  actualAmount: z.number().nonnegative().optional(),
  status: ReservationStatusSchema,
  expiresAt: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
});
export type Reservation = z.infer<typeof ReservationSchema>;

export const MeterEventIngestSchema = z.object({
  tenantId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  eventType: z.string().min(1),
  quantity: z.number().positive(),
  unitCostCredits: z.number().nonnegative().default(1),
  pricingVersion: z.string().default("v1"),
  timestamp: z.string().datetime().default(() => new Date().toISOString()),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type MeterEventIngest = z.infer<typeof MeterEventIngestSchema>;

export const ReserveCreditsSchema = z.object({
  tenantId: z.string().min(1),
  operationId: z.string().min(1),
  estimatedAmount: z.number().positive(),
  ttlSeconds: z.number().int().positive().default(300),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type ReserveCreditsInput = z.infer<typeof ReserveCreditsSchema>;

export const SettleCreditsSchema = z.object({
  reservationId: z.string().uuid(),
  actualAmount: z.number().nonnegative(),
  pricingVersion: z.string().default("v1"),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type SettleCreditsInput = z.infer<typeof SettleCreditsSchema>;

export const ReleaseCreditsSchema = z.object({
  reservationId: z.string().uuid(),
  reason: z.string().min(1).default("Operation cancelled or failed"),
});
export type ReleaseCreditsInput = z.infer<typeof ReleaseCreditsSchema>;

export const AutoRechargeConfigSchema = z.object({
  tenantId: z.string().min(1),
  enabled: z.boolean().default(false),
  thresholdBalance: z.number().nonnegative().default(100),
  rechargeAmount: z.number().positive().default(500),
  maxMonthlyRecharges: z.number().int().positive().default(5),
  currentMonthlyCount: z.number().int().nonnegative().default(0),
  paymentMethodId: z.string().nullable().default(null),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type AutoRechargeConfig = z.infer<typeof AutoRechargeConfigSchema>;

export const AdminCorrectionSchema = z.object({
  tenantId: z.string().min(1),
  amount: z.number(), // Can be positive or negative
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  adminUserId: z.string().min(1),
});
export type AdminCorrectionInput = z.infer<typeof AdminCorrectionSchema>;

export const UsageAlertSchema = z.object({
  tenantId: z.string().min(1),
  thresholdPercent: z.number().min(1).max(100),
  notifyEmail: z.string().email(),
  triggered: z.boolean().default(false),
});
export type UsageAlert = z.infer<typeof UsageAlertSchema>;
