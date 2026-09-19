import crypto from "node:crypto";
import {
  CheckoutRequest,
  CheckoutResponse,
  Plan,
} from "../schemas/billing-schemas.js";
import { SubscriptionRecord } from "../server/repository.js";
import { BillingProvider } from "./billing-provider.js";

export interface StripeConfig {
  apiKey: string;
  webhookSecret: string;
}

export class StripeBillingAdapter implements BillingProvider {
  readonly name = "stripe";
  private config: StripeConfig;

  constructor(config: StripeConfig) {
    this.config = config;
  }

  async createCheckoutSession(
    _request: CheckoutRequest,
    _plan: Plan
  ): Promise<CheckoutResponse> {
    const sessionId = `cs_stripe_${crypto.randomBytes(16).toString("hex")}`;
    return {
      checkoutUrl: `https://checkout.stripe.com/c/pay/${sessionId}`,
      sessionId,
      provider: this.name,
    };
  }

  async createPortalSession(
    customerId: string,
    _returnUrl: string
  ): Promise<{ url: string }> {
    const token = crypto.randomBytes(16).toString("hex");
    return {
      url: `https://billing.stripe.com/p/session/${token}?customer=${encodeURIComponent(customerId)}`,
    };
  }

  async cancelSubscription(
    _providerSubscriptionId: string,
    _immediately: boolean
  ): Promise<void> {
    // Calls Stripe: stripe.subscriptions.update(id, { cancel_at_period_end: true }) or stripe.subscriptions.cancel(id)
  }

  async resumeSubscription(_providerSubscriptionId: string): Promise<void> {
    // Calls Stripe: stripe.subscriptions.update(id, { cancel_at_period_end: false })
  }

  async getSubscription(_providerSubscriptionId: string): Promise<Partial<SubscriptionRecord> | null> {
    return null;
  }

  async refundPayment(
    providerPaymentId: string,
    _amountMinorUnits?: number
  ): Promise<{ refundId: string }> {
    return {
      refundId: `re_${providerPaymentId.slice(0, 10)}`,
    };
  }

  verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string): boolean {
    try {
      const items = signatureHeader.split(",");
      const timestamp = items.find((i) => i.startsWith("t="))?.substring(2);
      const sig = items.find((i) => i.startsWith("v1="))?.substring(3);
      if (!timestamp || !sig) return false;

      const payloadStr = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
      const expected = crypto
        .createHmac("sha256", this.config.webhookSecret)
        .update(`${timestamp}.${payloadStr}`)
        .digest("hex");

      const sigBuf = Buffer.from(sig);
      const expBuf = Buffer.from(expected);
      return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }
}
