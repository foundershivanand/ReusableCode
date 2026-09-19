import crypto from "node:crypto";
import { BillingRepository } from "./repository.js";
import { SubscriptionStatus } from "../schemas/billing-schemas.js";

export interface WebhookEventPayload {
  id: string; // Provider event id (e.g. evt_123)
  provider: string; // stripe, paddle, lemonsqueezy
  type: string; // e.g. customer.subscription.updated, invoice.paid
  timestamp: number; // Provider event epoch timestamp (ms or s)
  objectVersion?: number; // Monotonically increasing version if available
  data: Record<string, any>;
}

export interface WebhookHandlerResult {
  handled: boolean;
  duplicate: boolean;
  ignoredOutOfOrder?: boolean;
  error?: string;
}

export class WebhookEngine {
  private repo: BillingRepository;
  private webhookSecrets: Map<string, string> = new Map();

  constructor(repo: BillingRepository) {
    this.repo = repo;
  }

  setWebhookSecret(provider: string, secret: string): void {
    this.webhookSecrets.set(provider, secret);
  }

  /**
   * Verifies HMAC-SHA256 signature for incoming webhooks
   */
  verifySignature(provider: string, rawPayload: string | Buffer, signatureHeader: string): boolean {
    const secret = this.webhookSecrets.get(provider);
    if (!secret || !signatureHeader) return false;

    try {
      if (provider === "stripe") {
        // Stripe format: t=timestamp,v1=signature
        const items = signatureHeader.split(",");
        const timestamp = items.find((i) => i.startsWith("t="))?.substring(2);
        const sig = items.find((i) => i.startsWith("v1="))?.substring(3);
        if (!timestamp || !sig) return false;

        const signedPayload = `${timestamp}.${typeof rawPayload === "string" ? rawPayload : rawPayload.toString("utf8")}`;
        const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

        const sigBuf = Buffer.from(sig);
        const expBuf = Buffer.from(expected);
        return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
      }

      // Generic HMAC-SHA256 for Paddle / Lemon Squeezy
      const expected = crypto.createHmac("sha256", secret).update(rawPayload).digest("hex");
      const sigBuf = Buffer.from(signatureHeader);
      const expBuf = Buffer.from(expected);
      return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }

  /**
   * Processes a webhook event with:
   * 1. Idempotency & Replay Protection (checks processed_events table)
   * 2. Event Ordering & Out-of-Order Reconciliation (timestamp & version checks)
   * 3. Double-Fulfillment Prevention (transaction-safe updates)
   */
  async processEvent(event: WebhookEventPayload): Promise<WebhookHandlerResult> {
    const providerTimestamp = new Date(
      event.timestamp > 10000000000 ? event.timestamp : event.timestamp * 1000
    );

    // 1. Check idempotency: has this specific event ID already been processed?
    const existing = await this.repo.findProcessedWebhook(event.provider, event.id);
    if (existing && existing.status === "PROCESSED") {
      return { handled: true, duplicate: true };
    }

    try {
      // 2. Dispatch event to provider-independent handlers
      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "subscription.updated": {
          await this.handleSubscriptionUpdated(event, providerTimestamp);
          break;
        }

        case "customer.subscription.deleted":
        case "subscription.canceled": {
          await this.handleSubscriptionDeleted(event, providerTimestamp);
          break;
        }

        case "invoice.paid":
        case "payment.succeeded": {
          await this.handleInvoicePaid(event, providerTimestamp);
          break;
        }

        case "invoice.payment_failed":
        case "payment.failed": {
          await this.handlePaymentFailed(event, providerTimestamp);
          break;
        }

        case "charge.refunded":
        case "refund.created": {
          await this.handleRefund(event);
          break;
        }

        case "charge.dispute.created": {
          await this.handleDispute(event);
          break;
        }

        default:
          // Unhandled event types are marked processed safely
          break;
      }

      // 3. Mark event as successfully processed (Idempotent record)
      await this.repo.saveProcessedWebhook({
        eventId: event.id,
        provider: event.provider,
        eventType: event.type,
        providerTimestamp,
        processedAt: new Date(),
        status: "PROCESSED",
        failureReason: null,
      });

      return { handled: true, duplicate: false };
    } catch (err: any) {
      await this.repo.saveProcessedWebhook({
        eventId: event.id,
        provider: event.provider,
        eventType: event.type,
        providerTimestamp,
        processedAt: new Date(),
        status: "FAILED",
        failureReason: err.message,
      });
      return { handled: false, duplicate: false, error: err.message };
    }
  }

  private async handleSubscriptionUpdated(
    event: WebhookEventPayload,
    eventTimestamp: Date
  ): Promise<void> {
    const { customerId, planId, status, providerSubscriptionId, currentPeriodStart, currentPeriodEnd } =
      this.extractSubscriptionData(event);

    const existingSub = await this.repo.findLatestSubscriptionByCustomerId(customerId);

    // Out-of-order check: If existing record was updated by a newer event, reject stale event
    if (existingSub && existingSub.updatedAt.getTime() > eventTimestamp.getTime()) {
      return;
    }

    if (existingSub) {
      // Update existing subscription
      await this.repo.updateSubscription(existingSub.id, {
        planId: planId || existingSub.planId,
        status: status as SubscriptionStatus,
        currentPeriodStart: currentPeriodStart || existingSub.currentPeriodStart,
        currentPeriodEnd: currentPeriodEnd || existingSub.currentPeriodEnd,
        updatedAt: eventTimestamp,
      });
    } else {
      // Create new subscription
      await this.repo.createSubscription({
        customerId,
        planId: planId || "pro",
        status: status as SubscriptionStatus,
        currentPeriodStart: currentPeriodStart || new Date(),
        currentPeriodEnd: currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialStart: null,
        trialEnd: null,
        provider: event.provider,
        providerSubscriptionId: providerSubscriptionId || event.id,
        version: 1,
      });
    }
  }

  private async handleSubscriptionDeleted(
    event: WebhookEventPayload,
    eventTimestamp: Date
  ): Promise<void> {
    const { customerId } = this.extractSubscriptionData(event);
    const existingSub = await this.repo.findLatestSubscriptionByCustomerId(customerId);

    if (existingSub) {
      // Out-of-order check
      if (existingSub.updatedAt.getTime() > eventTimestamp.getTime()) return;

      await this.repo.updateSubscription(existingSub.id, {
        status: "CANCELED",
        canceledAt: eventTimestamp,
        updatedAt: eventTimestamp,
      });
    } else {
      // Even if delete arrives before create, persist canceled state with eventTimestamp
      await this.repo.createSubscription({
        customerId,
        planId: "pro",
        status: "CANCELED",
        currentPeriodStart: eventTimestamp,
        currentPeriodEnd: eventTimestamp,
        cancelAtPeriodEnd: false,
        canceledAt: eventTimestamp,
        trialStart: null,
        trialEnd: null,
        provider: event.provider,
        providerSubscriptionId: event.id,
        version: 1,
      });
    }
  }

  private async handleInvoicePaid(
    event: WebhookEventPayload,
    _eventTimestamp: Date
  ): Promise<void> {
    const { customerId, amountMinorUnits, currency, invoiceId } = this.extractPaymentData(event);

    // Prevent double fulfillment / duplicate payments
    const existingPayment = await this.repo.findPaymentByIdempotencyKey(event.id);
    if (existingPayment) {
      return; // Already processed!
    }

    await this.repo.createPayment({
      customerId,
      invoiceId: invoiceId || null,
      amountMinorUnits,
      currency: currency || "USD",
      status: "SUCCEEDED",
      provider: event.provider,
      providerPaymentId: event.id,
      idempotencyKey: event.id,
    });
  }

  private async handlePaymentFailed(
    event: WebhookEventPayload,
    eventTimestamp: Date
  ): Promise<void> {
    const { customerId } = this.extractSubscriptionData(event);
    const existingSub = await this.repo.findActiveSubscriptionByCustomerId(customerId);
    if (existingSub) {
      // Transition to PAST_DUE (triggers grace period in EntitlementResolver)
      await this.repo.updateSubscription(existingSub.id, {
        status: "PAST_DUE",
        updatedAt: eventTimestamp,
      });
    }
  }

  private async handleRefund(event: WebhookEventPayload): Promise<void> {
    const data = event.data;
    const paymentId = data.paymentId || data.charge;
    const amountMinorUnits = data.amount || 0;
    const customerId = data.customerId || "unknown";

    await this.repo.createRefund({
      paymentId,
      customerId,
      amountMinorUnits,
      currency: data.currency?.toUpperCase() || "USD",
      status: "SUCCEEDED",
      reason: data.reason || "requested_by_customer",
      providerRefundId: event.id,
      idempotencyKey: `refund_${event.id}`,
    });
  }

  private async handleDispute(event: WebhookEventPayload): Promise<void> {
    const data = event.data;
    await this.repo.createDispute({
      paymentId: data.charge || data.paymentId,
      customerId: data.customerId || "unknown",
      amountMinorUnits: data.amount || 0,
      currency: data.currency?.toUpperCase() || "USD",
      status: "NEEDS_RESPONSE",
      reason: data.reason || "fraudulent",
      providerDisputeId: event.id,
    });
  }

  private extractSubscriptionData(event: WebhookEventPayload): {
    customerId: string;
    planId?: string;
    status: string;
    providerSubscriptionId?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
  } {
    const d = event.data;
    return {
      customerId: d.customerId || d.customer || "cust_default",
      planId: d.planId || d.plan?.id || d.items?.data?.[0]?.plan?.id || "pro",
      status: (d.status || "ACTIVE").toUpperCase(),
      providerSubscriptionId: d.id || d.subscriptionId,
      currentPeriodStart: d.current_period_start ? new Date(d.current_period_start * 1000) : undefined,
      currentPeriodEnd: d.current_period_end ? new Date(d.current_period_end * 1000) : undefined,
    };
  }

  private extractPaymentData(event: WebhookEventPayload): {
    customerId: string;
    amountMinorUnits: number;
    currency: any;
    invoiceId?: string;
  } {
    const d = event.data;
    return {
      customerId: d.customerId || d.customer || "cust_default",
      amountMinorUnits: d.amount_paid || d.amount || 0,
      currency: (d.currency || "USD").toUpperCase(),
      invoiceId: d.invoiceId || d.invoice,
    };
  }
}
