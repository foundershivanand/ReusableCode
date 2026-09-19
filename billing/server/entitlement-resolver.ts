import { BillingRepository } from "./repository.js";
import { Entitlement } from "../schemas/billing-schemas.js";

export interface GracePeriodConfig {
  failedPaymentGracePeriodDays: number; // e.g. 3 days
  disputedPaymentGracePeriodDays: number; // e.g. 0 days (immediate suspend) or 1 day
}

export const DEFAULT_GRACE_CONFIG: GracePeriodConfig = {
  failedPaymentGracePeriodDays: 3,
  disputedPaymentGracePeriodDays: 0,
};

export class EntitlementResolver {
  private repo: BillingRepository;
  private graceConfig: GracePeriodConfig;

  constructor(repo: BillingRepository, graceConfig: Partial<GracePeriodConfig> = {}) {
    this.repo = repo;
    this.graceConfig = { ...DEFAULT_GRACE_CONFIG, ...graceConfig };
  }

  /**
   * Resolves the authoritative product entitlements for a customer.
   * Architecture:
   * Payment status -> Subscription state -> Product entitlement
   */
  async resolveEntitlement(customerId: string): Promise<Entitlement> {
    const sub = await this.repo.findActiveSubscriptionByCustomerId(customerId);

    if (!sub) {
      return this.getFreeEntitlement(customerId);
    }

    const plan = await this.repo.findPlanById(sub.planId);
    if (!plan) {
      return this.getFreeEntitlement(customerId);
    }

    const now = new Date();

    // 1. TRIALING
    if (sub.status === "TRIALING") {
      const trialEnded = sub.trialEnd && sub.trialEnd.getTime() <= now.getTime();
      if (trialEnded) {
        return this.getFreeEntitlement(customerId);
      }
      return {
        customerId,
        planId: plan.id,
        features: plan.features,
        limits: plan.limits,
        hasAccess: true,
        inGracePeriod: false,
        gracePeriodEndsAt: null,
      };
    }

    // 2. ACTIVE
    if (sub.status === "ACTIVE") {
      // Check if scheduled cancellation date has passed
      if (sub.cancelAtPeriodEnd && sub.currentPeriodEnd.getTime() <= now.getTime()) {
        return this.getFreeEntitlement(customerId);
      }

      return {
        customerId,
        planId: plan.id,
        features: plan.features,
        limits: plan.limits,
        hasAccess: true,
        inGracePeriod: false,
        gracePeriodEndsAt: null,
      };
    }

    // 3. PAST_DUE (Grace period handling for failed payments / expired cards)
    if (sub.status === "PAST_DUE") {
      const graceMs = this.graceConfig.failedPaymentGracePeriodDays * 24 * 60 * 60 * 1000;
      const gracePeriodEndsAt = new Date(sub.updatedAt.getTime() + graceMs);

      if (now.getTime() <= gracePeriodEndsAt.getTime()) {
        // Still within grace period: maintain access!
        return {
          customerId,
          planId: plan.id,
          features: plan.features,
          limits: plan.limits,
          hasAccess: true,
          inGracePeriod: true,
          gracePeriodEndsAt,
        };
      }

      // Grace period expired
      return this.getFreeEntitlement(customerId);
    }

    // 4. CANCELED, UNPAID, PAUSED, INCOMPLETE
    return this.getFreeEntitlement(customerId);
  }

  /**
   * Checks if a customer has access to a specific feature key
   */
  async hasFeature(customerId: string, featureKey: string): Promise<boolean> {
    const entitlement = await this.resolveEntitlement(customerId);
    if (!entitlement.hasAccess) return false;
    return entitlement.features.includes(featureKey) || entitlement.features.includes("*");
  }

  /**
   * Gets the numerical limit for a specific resource
   */
  async getPlanLimit(customerId: string, limitKey: string): Promise<number> {
    const entitlement = await this.resolveEntitlement(customerId);
    if (!entitlement.hasAccess) return 0;
    return entitlement.limits[limitKey] ?? 0;
  }

  /**
   * Checks if a customer has an active subscription to a specific plan (or any plan)
   */
  async hasActivePlan(customerId: string, planId?: string): Promise<boolean> {
    const entitlement = await this.resolveEntitlement(customerId);
    if (!entitlement.hasAccess) return false;
    if (planId) {
      return entitlement.planId === planId;
    }
    return entitlement.planId !== "free";
  }

  private getFreeEntitlement(customerId: string): Entitlement {
    return {
      customerId,
      planId: "free",
      features: ["free_tier"],
      limits: { max_items: 10, api_calls: 100 },
      hasAccess: true,
      inGracePeriod: false,
      gracePeriodEndsAt: null,
    };
  }
}
