import { z } from "zod";

/**
 * Supported Currency ISO Codes
 */
export const CurrencyEnum = z.enum([
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "INR",
  "SGD",
  "CHF",
]);
export type Currency = z.infer<typeof CurrencyEnum>;

/**
 * Zero-decimal currencies where 1 unit = 1 minor unit (no cents/subunits)
 */
export const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "BIF", "CLP", "PYG", "VND", "RWF"]);

/**
 * Financial State Machine Enums (Page 15)
 */
export const PaymentStatusEnum = z.enum([
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
  "DISPUTED",
  "CANCELED",
]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

export const InvoiceStatusEnum = z.enum([
  "DRAFT",
  "OPEN",
  "PAID",
  "VOID",
  "UNCOLLECTIBLE",
]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;

export const SubscriptionStatusEnum = z.enum([
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
  "UNPAID",
  "PAUSED",
  "INCOMPLETE",
  "INCOMPLETE_EXPIRED",
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusEnum>;

export const RefundStatusEnum = z.enum([
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "REVERSED",
]);
export type RefundStatus = z.infer<typeof RefundStatusEnum>;

export const DisputeStatusEnum = z.enum([
  "WARNING_NEEDS_RESPONSE",
  "NEEDS_RESPONSE",
  "UNDER_REVIEW",
  "WON",
  "LOST",
]);
export type DisputeStatus = z.infer<typeof DisputeStatusEnum>;

export const PaymentMethodStatusEnum = z.enum([
  "ACTIVE",
  "EXPIRED",
  "DETACHED",
  "FAILED",
]);
export type PaymentMethodStatus = z.infer<typeof PaymentMethodStatusEnum>;

export const PlanIntervalEnum = z.enum(["month", "year", "one_time"]);
export type PlanInterval = z.infer<typeof PlanIntervalEnum>;

/**
 * 1. Plan Schema
 */
export const PlanSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  amountMinorUnits: z.number().int().nonnegative(), // Stored in minor units (cents)
  currency: CurrencyEnum,
  interval: PlanIntervalEnum,
  trialDays: z.number().int().nonnegative().default(0),
  features: z.array(z.string().max(100)),
  limits: z.record(z.string(), z.number().int().nonnegative()),
  metadata: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().default(true),
});
export type Plan = z.infer<typeof PlanSchema>;

/**
 * 2. Checkout Request Schema
 */
export const CheckoutRequestSchema = z.object({
  planId: z.string().min(1).max(64),
  customerId: z.string().min(1).max(128),
  successUrl: z.string().url().max(2048),
  cancelUrl: z.string().url().max(2048),
  couponCode: z.string().trim().max(32).optional(),
  billingAddress: z
    .object({
      line1: z.string().max(255),
      line2: z.string().max(255).optional(),
      city: z.string().max(100),
      state: z.string().max(100).optional(),
      postalCode: z.string().max(32),
      country: z.string().length(2), // ISO-3166-1 alpha-2
    })
    .optional(),
  taxId: z.string().max(64).optional(),
});
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

export const CheckoutResponseSchema = z.object({
  checkoutUrl: z.string().url(),
  sessionId: z.string().min(1),
  provider: z.string(),
});
export type CheckoutResponse = z.infer<typeof CheckoutResponseSchema>;

/**
 * 3. Subscription Schema
 */
export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().min(1),
  planId: z.string().min(1),
  status: SubscriptionStatusEnum,
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  cancelAtPeriodEnd: z.boolean(),
  canceledAt: z.date().nullable(),
  trialStart: z.date().nullable(),
  trialEnd: z.date().nullable(),
  provider: z.string(),
  providerSubscriptionId: z.string(),
  version: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

/**
 * 4. Invoice & Price Immutability Schema
 * Historical invoices must retain the price/tax/discount values that existed when purchased.
 */
export const InvoiceLineItemSchema = z.object({
  description: z.string().max(255),
  amountMinorUnits: z.number().int(),
  quantity: z.number().int().positive().default(1),
  taxRatePercent: z.number().nonnegative().default(0),
  taxAmountMinorUnits: z.number().int().nonnegative().default(0),
});
export type InvoiceLineItem = z.infer<typeof InvoiceLineItemSchema>;

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().min(1),
  subscriptionId: z.string().uuid().nullable(),
  currency: CurrencyEnum,
  subtotalMinorUnits: z.number().int().nonnegative(),
  taxMinorUnits: z.number().int().nonnegative(),
  discountMinorUnits: z.number().int().nonnegative(),
  totalMinorUnits: z.number().int().nonnegative(),
  status: InvoiceStatusEnum,
  lineItems: z.array(InvoiceLineItemSchema),
  invoicePdfUrl: z.string().url().optional(),
  providerInvoiceId: z.string().optional(),
  createdAt: z.date(),
  paidAt: z.date().nullable(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

/**
 * 5. Payment Transaction Schema
 */
export const PaymentTransactionSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().min(1),
  invoiceId: z.string().uuid().nullable(),
  amountMinorUnits: z.number().int().positive(),
  currency: CurrencyEnum,
  status: PaymentStatusEnum,
  provider: z.string(),
  providerPaymentId: z.string(),
  idempotencyKey: z.string(),
  createdAt: z.date(),
});
export type PaymentTransaction = z.infer<typeof PaymentTransactionSchema>;

/**
 * 6. Refund Request Schema
 */
export const RefundRequestSchema = z.object({
  paymentId: z.string().uuid(),
  amountMinorUnits: z.number().int().positive().optional(), // Null for full refund
  reason: z.enum(["duplicate", "fraudulent", "requested_by_customer", "other"]).default("requested_by_customer"),
  idempotencyKey: z.string().min(16).max(255),
});
export type RefundRequest = z.infer<typeof RefundRequestSchema>;

/**
 * 7. Coupon Schema
 */
export const CouponSchema = z.object({
  code: z.string().trim().toUpperCase().min(3).max(32),
  discountType: z.enum(["percentage", "fixed"]),
  value: z.number().positive(), // e.g. 20 for 20% or 1000 for $10.00
  currency: CurrencyEnum.optional(), // Required if fixed
  maxRedemptions: z.number().int().positive().nullable(),
  redemptionsCount: z.number().int().nonnegative().default(0),
  expiresAt: z.date().nullable(),
  isActive: z.boolean().default(true),
});
export type Coupon = z.infer<typeof CouponSchema>;

/**
 * 8. Entitlement Schema
 */
export const EntitlementSchema = z.object({
  customerId: z.string(),
  planId: z.string(),
  features: z.array(z.string()),
  limits: z.record(z.string(), z.number()),
  hasAccess: z.boolean(),
  inGracePeriod: z.boolean(),
  gracePeriodEndsAt: z.date().nullable(),
});
export type Entitlement = z.infer<typeof EntitlementSchema>;
