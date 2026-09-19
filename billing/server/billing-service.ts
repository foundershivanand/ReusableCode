import crypto from "node:crypto";
import {
  BillingRepository,
  InvoiceRecord,
  PaymentTransactionRecord,
  RefundRecord,
  SubscriptionRecord,
} from "./repository.js";
import { EntitlementResolver } from "./entitlement-resolver.js";
import { TaxProvider, DefaultTaxProvider } from "./tax-engine.js";
import { Money } from "./money.js";
import {
  CheckoutRequest,
  CheckoutResponse,
  Entitlement,
  InvoiceLineItem,
  Plan,
} from "../schemas/billing-schemas.js";

export interface BillingServiceConfig {
  defaultCurrency: "USD" | "EUR" | "GBP";
  portalSessionTtlSeconds: number; // e.g. 900 (15 minutes)
}

export const DEFAULT_BILLING_CONFIG: BillingServiceConfig = {
  defaultCurrency: "USD",
  portalSessionTtlSeconds: 15 * 60,
};

export class BillingService {
  private repo: BillingRepository;
  private entitlementResolver: EntitlementResolver;
  private taxProvider: TaxProvider;
  private config: BillingServiceConfig;

  constructor(
    repo: BillingRepository,
    deps?: {
      entitlementResolver?: EntitlementResolver;
      taxProvider?: TaxProvider;
      config?: Partial<BillingServiceConfig>;
    }
  ) {
    this.repo = repo;
    this.entitlementResolver = deps?.entitlementResolver || new EntitlementResolver(repo);
    this.taxProvider = deps?.taxProvider || new DefaultTaxProvider();
    this.config = { ...DEFAULT_BILLING_CONFIG, ...deps?.config };
  }

  // ==========================================
  // Core Application APIs (Required by Page 14)
  // ==========================================

  /**
   * 1. getSubscription()
   */
  async getSubscription(customerId: string): Promise<SubscriptionRecord | null> {
    return this.repo.findActiveSubscriptionByCustomerId(customerId);
  }

  /**
   * 2. hasActivePlan()
   */
  async hasActivePlan(customerId: string, planId?: string): Promise<boolean> {
    return this.entitlementResolver.hasActivePlan(customerId, planId);
  }

  /**
   * 3. hasFeature()
   */
  async hasFeature(customerId: string, featureKey: string): Promise<boolean> {
    return this.entitlementResolver.hasFeature(customerId, featureKey);
  }

  /**
   * 4. getPlanLimit()
   */
  async getPlanLimit(customerId: string, limitKey: string): Promise<number> {
    return this.entitlementResolver.getPlanLimit(customerId, limitKey);
  }

  /**
   * 5. cancelSubscription()
   * Supports scheduled cancellation at period end or immediate cancellation
   */
  async cancelSubscription(
    customerId: string,
    cancelImmediately: boolean = false
  ): Promise<SubscriptionRecord> {
    const sub = await this.repo.findActiveSubscriptionByCustomerId(customerId);
    if (!sub) {
      throw new Error("No active subscription found for customer");
    }

    const now = new Date();
    const updates: Partial<SubscriptionRecord> = {
      cancelAtPeriodEnd: !cancelImmediately,
      canceledAt: now,
      status: cancelImmediately ? "CANCELED" : sub.status,
    };

    return this.repo.updateSubscription(sub.id, updates);
  }

  /**
   * 5b. resumeSubscription()
   * Resumes a subscription that was scheduled for cancellation at period end
   */
  async resumeSubscription(customerId: string): Promise<SubscriptionRecord> {
    const sub = await this.repo.findActiveSubscriptionByCustomerId(customerId);
    if (!sub || !sub.cancelAtPeriodEnd) {
      throw new Error("No scheduled cancellation to resume");
    }

    return this.repo.updateSubscription(sub.id, {
      cancelAtPeriodEnd: false,
      canceledAt: null,
    });
  }

  /**
   * 5c. pauseSubscription()
   */
  async pauseSubscription(customerId: string): Promise<SubscriptionRecord> {
    const sub = await this.repo.findActiveSubscriptionByCustomerId(customerId);
    if (!sub || sub.status !== "ACTIVE") {
      throw new Error("Cannot pause non-active subscription");
    }

    return this.repo.updateSubscription(sub.id, {
      status: "PAUSED",
    });
  }

  /**
   * 6. createCheckout()
   * Creates a checkout session with price snapshotting and coupon/tax calculations
   */
  async createCheckout(
    request: CheckoutRequest,
    provider: string = "stripe"
  ): Promise<CheckoutResponse> {
    const plan = await this.repo.findPlanById(request.planId);
    if (!plan || !plan.isActive) {
      throw new Error("Invalid or inactive plan");
    }

    let baseAmount = new Money(plan.amountMinorUnits, plan.currency);

    // Apply coupon if provided
    let discountAmount = new Money(0, plan.currency);
    if (request.couponCode) {
      const coupon = await this.repo.findCouponByCode(request.couponCode);
      if (coupon && coupon.isActive) {
        if (coupon.discountType === "percentage") {
          discountAmount = baseAmount.multiply(coupon.value / 100);
        } else if (coupon.discountType === "fixed" && coupon.currency === plan.currency) {
          discountAmount = new Money(coupon.value, plan.currency);
        }
        await this.repo.incrementCouponRedemption(coupon.code);
      }
    }

    const discountedAmount = baseAmount.subtract(discountAmount);

    // Calculate tax
    const taxResult = await this.taxProvider.calculateTax({
      amount: discountedAmount,
      billingAddress: request.billingAddress,
      taxId: request.taxId,
      isTaxInclusive: false,
    });

    // Create Immutable Invoice Line Item snapshot
    const lineItems: InvoiceLineItem[] = [
      {
        description: `${plan.name} (${plan.interval})`,
        amountMinorUnits: baseAmount.minorUnits,
        quantity: 1,
        taxRatePercent: taxResult.taxRatePercent,
        taxAmountMinorUnits: taxResult.taxAmount.minorUnits,
      },
    ];

    // Create Draft / Open Invoice with immutable price snapshots
    const invoice = await this.repo.createInvoice({
      customerId: request.customerId,
      subscriptionId: null,
      currency: plan.currency,
      subtotalMinorUnits: taxResult.subtotal.minorUnits,
      taxMinorUnits: taxResult.taxAmount.minorUnits,
      discountMinorUnits: discountAmount.minorUnits,
      totalMinorUnits: taxResult.total.minorUnits,
      status: "OPEN",
      lineItems,
      paidAt: null,
    });

    const sessionId = `cs_${crypto.randomBytes(16).toString("hex")}`;
    const checkoutUrl = `${request.successUrl}?session_id=${sessionId}&invoice_id=${invoice.id}`;

    return {
      checkoutUrl,
      sessionId,
      provider,
    };
  }

  /**
   * 7. createBillingPortalSession()
   * Generates short-lived, customer-scoped billing portal URLs server-side
   * (Page 16: Never accepted directly from client input)
   */
  async createBillingPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<{ portalUrl: string; expiresAt: Date }> {
    const customer = await this.repo.findCustomerById(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + this.config.portalSessionTtlSeconds * 1000);

    const portalUrl = `https://billing.provider.com/portal?token=${token}&cust=${encodeURIComponent(customerId)}&return_url=${encodeURIComponent(returnUrl)}`;

    return {
      portalUrl,
      expiresAt,
    };
  }

  /**
   * 8. processRefund() (Refund Consistency - Page 16)
   * Refunding money correctly updates:
   * - payment state -> REFUNDED / PARTIALLY_REFUNDED
   * - entitlement state (if full refund, revokes entitlement)
   * - invoice state
   * - audit records
   */
  async processRefund(params: {
    paymentId: string;
    amountMinorUnits?: number;
    reason?: string;
    idempotencyKey: string;
  }): Promise<RefundRecord> {
    const payment = await this.repo.findPaymentById(params.paymentId);
    if (!payment) {
      throw new Error("Payment transaction not found");
    }

    if (payment.status === "REFUNDED") {
      const existing = await this.repo.findRefundByIdempotencyKey(params.idempotencyKey);
      if (existing) return existing;
      throw new Error("Payment has already been fully refunded");
    }

    const refundAmount = params.amountMinorUnits || payment.amountMinorUnits;
    if (refundAmount > payment.amountMinorUnits) {
      throw new Error("Refund amount exceeds original payment amount");
    }

    const isFullRefund = refundAmount === payment.amountMinorUnits;

    // Create refund record
    const refund = await this.repo.createRefund({
      paymentId: payment.id,
      customerId: payment.customerId,
      amountMinorUnits: refundAmount,
      currency: payment.currency,
      status: "SUCCEEDED",
      reason: params.reason || "requested_by_customer",
      idempotencyKey: params.idempotencyKey,
    });

    // Update payment state
    await this.repo.updatePayment(payment.id, {
      status: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
    });

    // Update invoice state if linked
    if (payment.invoiceId) {
      await this.repo.updateInvoice(payment.invoiceId, {
        status: isFullRefund ? "VOID" : "PAID",
      });
    }

    // Revoke entitlement if full refund
    if (isFullRefund) {
      const sub = await this.repo.findActiveSubscriptionByCustomerId(payment.customerId);
      if (sub) {
        await this.repo.updateSubscription(sub.id, {
          status: "CANCELED",
          canceledAt: new Date(),
        });
      }
    }

    return refund;
  }

  /**
   * 9. getEntitlements()
   */
  async getEntitlements(customerId: string): Promise<Entitlement> {
    return this.entitlementResolver.resolveEntitlement(customerId);
  }

  /**
   * 10. listCustomerInvoices()
   */
  async listCustomerInvoices(customerId: string): Promise<InvoiceRecord[]> {
    return this.repo.findInvoicesByCustomerId(customerId);
  }

  /**
   * 11. listCustomerPayments()
   */
  async listCustomerPayments(customerId: string): Promise<PaymentTransactionRecord[]> {
    return this.repo.findPaymentsByCustomerId(customerId);
  }

  /**
   * 12. registerPlan()
   */
  async registerPlan(plan: Plan): Promise<Plan> {
    return this.repo.createPlan(plan);
  }

  getRepository(): BillingRepository {
    return this.repo;
  }
}
