import { useBilling } from "./react-context.js";

/**
 * Hook to check feature access and plan limits without scattering `if (paid === true)`
 */
export function useEntitlements() {
  const { entitlement, isLoading } = useBilling();

  return {
    isLoading,
    hasAccess: entitlement?.hasAccess ?? false,
    inGracePeriod: entitlement?.inGracePeriod ?? false,
    gracePeriodEndsAt: entitlement?.gracePeriodEndsAt,
    planId: entitlement?.planId ?? "free",
    hasFeature: (featureKey: string): boolean => {
      if (!entitlement || !entitlement.hasAccess) return false;
      return entitlement.features.includes(featureKey) || entitlement.features.includes("*");
    },
    getLimit: (limitKey: string): number => {
      if (!entitlement || !entitlement.hasAccess) return 0;
      return entitlement.limits[limitKey] ?? 0;
    },
  };
}

/**
 * Hook for managing current subscription
 */
export function useSubscription() {
  const {
    subscription,
    isLoading,
    createCheckout,
    cancelSubscription,
    resumeSubscription,
    openBillingPortal,
  } = useBilling();

  return {
    subscription,
    isLoading,
    isActive: subscription?.status === "ACTIVE" || subscription?.status === "TRIALING",
    isTrialing: subscription?.status === "TRIALING",
    isPastDue: subscription?.status === "PAST_DUE",
    isScheduledForCancellation: subscription?.cancelAtPeriodEnd ?? false,
    createCheckout,
    cancelSubscription,
    resumeSubscription,
    openBillingPortal,
  };
}

/**
 * Hook for historical invoices
 */
export function useInvoices() {
  const { invoices, isLoading } = useBilling();
  return { invoices, isLoading };
}
