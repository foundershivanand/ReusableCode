import {
  CheckoutRequest,
  CheckoutResponse,
  Entitlement,
  Plan,
} from "../schemas/billing-schemas.js";
import {
  InvoiceRecord,
  PaymentTransactionRecord,
  SubscriptionRecord,
} from "../server/repository.js";

export interface BillingClientResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export class BillingClient {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<BillingClientResponse<T>> {
    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers as Record<string, string>),
        },
        credentials: "include",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        return {
          success: false,
          error: json?.error || {
            code: `HTTP_${res.status}`,
            message: res.statusText || "Billing request failed",
          },
        };
      }

      return {
        success: true,
        data: json?.data ?? json,
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: err.message || "Network request failed",
        },
      };
    }
  }

  async getPlans(): Promise<BillingClientResponse<{ plans: Plan[] }>> {
    return this.request("/api/billing/plans");
  }

  async getSubscription(): Promise<BillingClientResponse<{ subscription: SubscriptionRecord | null }>> {
    return this.request("/api/billing/subscription");
  }

  async getEntitlements(): Promise<BillingClientResponse<{ entitlement: Entitlement }>> {
    return this.request("/api/billing/entitlements");
  }

  async createCheckout(request: CheckoutRequest): Promise<BillingClientResponse<CheckoutResponse>> {
    return this.request("/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async createPortalSession(returnUrl: string): Promise<BillingClientResponse<{ portalUrl: string }>> {
    return this.request("/api/billing/portal", {
      method: "POST",
      body: JSON.stringify({ returnUrl }),
    });
  }

  async cancelSubscription(cancelImmediately: boolean = false): Promise<BillingClientResponse<{ subscription: SubscriptionRecord }>> {
    return this.request("/api/billing/subscription/cancel", {
      method: "POST",
      body: JSON.stringify({ cancelImmediately }),
    });
  }

  async resumeSubscription(): Promise<BillingClientResponse<{ subscription: SubscriptionRecord }>> {
    return this.request("/api/billing/subscription/resume", {
      method: "POST",
    });
  }

  async getInvoices(): Promise<BillingClientResponse<{ invoices: InvoiceRecord[] }>> {
    return this.request("/api/billing/invoices");
  }

  async getPaymentHistory(): Promise<BillingClientResponse<{ payments: PaymentTransactionRecord[] }>> {
    return this.request("/api/billing/payments");
  }
}
