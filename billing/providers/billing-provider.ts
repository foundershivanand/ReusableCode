import {
  CheckoutRequest,
  CheckoutResponse,
  Plan,
} from "../schemas/billing-schemas.js";
import { SubscriptionRecord } from "../server/repository.js";

export interface BillingProvider {
  readonly name: string;

  createCheckoutSession(request: CheckoutRequest, plan: Plan): Promise<CheckoutResponse>;

  createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }>;

  cancelSubscription(providerSubscriptionId: string, immediately: boolean): Promise<void>;

  resumeSubscription(providerSubscriptionId: string): Promise<void>;

  getSubscription(providerSubscriptionId: string): Promise<Partial<SubscriptionRecord> | null>;

  refundPayment(providerPaymentId: string, amountMinorUnits?: number): Promise<{ refundId: string }>;

  verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string): boolean;
}
