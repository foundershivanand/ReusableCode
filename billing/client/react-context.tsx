import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { BillingClient } from "./billing-client.js";
import { Entitlement, Plan } from "../schemas/billing-schemas.js";
import { InvoiceRecord, PaymentTransactionRecord, SubscriptionRecord } from "../server/repository.js";

export interface BillingContextType {
  subscription: SubscriptionRecord | null;
  entitlement: Entitlement | null;
  plans: Plan[];
  invoices: InvoiceRecord[];
  payments: PaymentTransactionRecord[];
  isLoading: boolean;
  client: BillingClient;
  refreshBilling: () => Promise<void>;
  createCheckout: (planId: string, options?: { couponCode?: string }) => Promise<string>;
  openBillingPortal: (returnUrl?: string) => Promise<void>;
  cancelSubscription: (immediately?: boolean) => Promise<void>;
  resumeSubscription: () => Promise<void>;
}

const BillingContext = createContext<BillingContextType | null>(null);

export interface BillingProviderProps {
  children: React.ReactNode;
  customerId: string;
  client?: BillingClient;
}

export const BillingProvider: React.FC<BillingProviderProps> = ({
  children,
  customerId,
  client = new BillingClient(),
}) => {
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentTransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshBilling = useCallback(async () => {
    setIsLoading(true);
    try {
      const [subRes, entRes, plansRes, invRes, payRes] = await Promise.all([
        client.getSubscription(),
        client.getEntitlements(),
        client.getPlans(),
        client.getInvoices(),
        client.getPaymentHistory(),
      ]);

      if (subRes.success && subRes.data) setSubscription(subRes.data.subscription);
      if (entRes.success && entRes.data) setEntitlement(entRes.data.entitlement);
      if (plansRes.success && plansRes.data) setPlans(plansRes.data.plans);
      if (invRes.success && invRes.data) setInvoices(invRes.data.invoices);
      if (payRes.success && payRes.data) setPayments(payRes.data.payments);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    refreshBilling();
  }, [refreshBilling]);

  const createCheckout = useCallback(
    async (planId: string, options?: { couponCode?: string }): Promise<string> => {
      const res = await client.createCheckout({
        planId,
        customerId,
        successUrl: window.location.origin + "/billing/success",
        cancelUrl: window.location.origin + "/billing/cancel",
        couponCode: options?.couponCode,
      });

      if (!res.success || !res.data?.checkoutUrl) {
        throw new Error(res.error?.message || "Failed to create checkout session");
      }

      return res.data.checkoutUrl;
    },
    [client, customerId]
  );

  const openBillingPortal = useCallback(
    async (returnUrl?: string): Promise<void> => {
      const res = await client.createPortalSession(returnUrl || window.location.href);
      if (!res.success || !res.data?.portalUrl) {
        throw new Error(res.error?.message || "Failed to open billing portal");
      }
      window.location.href = res.data.portalUrl;
    },
    [client]
  );

  const cancelSub = useCallback(
    async (immediately: boolean = false): Promise<void> => {
      const res = await client.cancelSubscription(immediately);
      if (!res.success) throw new Error(res.error?.message || "Failed to cancel subscription");
      await refreshBilling();
    },
    [client, refreshBilling]
  );

  const resumeSub = useCallback(async (): Promise<void> => {
    const res = await client.resumeSubscription();
    if (!res.success) throw new Error(res.error?.message || "Failed to resume subscription");
    await refreshBilling();
  }, [client, refreshBilling]);

  return (
    <BillingContext.Provider
      value={{
        subscription,
        entitlement,
        plans,
        invoices,
        payments,
        isLoading,
        client,
        refreshBilling,
        createCheckout,
        openBillingPortal,
        cancelSubscription: cancelSub,
        resumeSubscription: resumeSub,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
};

export function useBilling(): BillingContextType {
  const ctx = useContext(BillingContext);
  if (!ctx) {
    throw new Error("useBilling must be used within a <BillingProvider />");
  }
  return ctx;
}
