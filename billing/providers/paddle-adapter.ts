import crypto from "node:crypto";
import {
  CheckoutRequest,
  CheckoutResponse,
  Plan,
} from "../schemas/billing-schemas.js";
import { SubscriptionRecord } from "../server/repository.js";
import { BillingProvider } from "./billing-provider.js";

export interface PaddleConfig {
  apiKey: string;
  webhookSecret: string;
}

export class PaddleBillingAdapter implements BillingProvider {
  readonly name = "paddle";
  private config: PaddleConfig;

  constructor(config: PaddleConfig) {
    this.config = config;
  }

  async createCheckoutSession(
    _request: CheckoutRequest,
    _plan: Plan
  ): Promise<CheckoutResponse> {
    const txnId = `txn_paddle_${crypto.randomBytes(16).toString("hex")}`;
    return {
      checkoutUrl: `https://checkout.paddle.com/checkout/${txnId}`,
      sessionId: txnId,
      provider: this.name,
    };
  }

  async createPortalSession(
    customerId: string,
    _returnUrl: string
  ): Promise<{ url: string }> {
    return {
      url: `https://customer.paddle.com/portal/${encodeURIComponent(customerId)}`,
    };
  }

  async cancelSubscription(
    _providerSubscriptionId: string,
    _immediately: boolean
  ): Promise<void> {}

  async resumeSubscription(_providerSubscriptionId: string): Promise<void> {}

  async getSubscription(_providerSubscriptionId: string): Promise<Partial<SubscriptionRecord> | null> {
    return null;
  }

  async refundPayment(
    providerPaymentId: string,
    _amountMinorUnits?: number
  ): Promise<{ refundId: string }> {
    return { refundId: `ref_paddle_${providerPaymentId.slice(0, 8)}` };
  }

  verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string): boolean {
    try {
      const expected = crypto
        .createHmac("sha256", this.config.webhookSecret)
        .update(rawBody)
        .digest("hex");
      const sigBuf = Buffer.from(signatureHeader);
      const expBuf = Buffer.from(expected);
      return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }
}
