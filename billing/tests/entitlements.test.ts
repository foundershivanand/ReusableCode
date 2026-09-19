import { describe, expect, it } from "vitest";
import { EntitlementResolver } from "../server/entitlement-resolver.js";
import { InMemoryBillingRepository } from "../server/repository.js";
import { Plan } from "../schemas/billing-schemas.js";

describe("Entitlement Resolver & Grace Periods (Page 15-16)", () => {
  async function setup() {
    const repo = new InMemoryBillingRepository();
    const resolver = new EntitlementResolver(repo, { failedPaymentGracePeriodDays: 3 });

    const proPlan: Plan = {
      id: "plan_pro",
      name: "Pro Plan",
      amountMinorUnits: 2900,
      currency: "USD",
      interval: "month",
      trialDays: 14,
      features: ["feature_analytics", "feature_export"],
      limits: { projects: 10 },
      isActive: true,
    };

    await repo.createPlan(proPlan);
    return { repo, resolver, proPlan };
  }

  it("returns default free tier entitlements when customer has no active subscription", async () => {
    const { resolver } = await setup();

    const ent = await resolver.resolveEntitlement("cust_free");
    expect(ent.planId).toBe("free");
    expect(ent.hasAccess).toBe(true);
    expect(await resolver.hasFeature("cust_free", "free_tier")).toBe(true);
    expect(await resolver.hasFeature("cust_free", "feature_analytics")).toBe(false);
  });

  it("grants entitlements for active trial and revokes when trial expires", async () => {
    const { resolver, repo } = await setup();

    const now = new Date();
    // Active trial: ends tomorrow
    const sub = await repo.createSubscription({
      customerId: "cust_trial",
      planId: "plan_pro",
      status: "TRIALING",
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      canceledAt: null,
      trialStart: now,
      trialEnd: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      provider: "stripe",
      providerSubscriptionId: "sub_trial",
      version: 1,
    });

    expect(await resolver.hasFeature("cust_trial", "feature_analytics")).toBe(true);

    // Fast-forward: trial ended yesterday
    await repo.updateSubscription(sub.id, {
      trialEnd: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    });

    expect(await resolver.hasFeature("cust_trial", "feature_analytics")).toBe(false);
  });

  it("maintains access during failed payment grace period (3 days) and revokes after", async () => {
    const { resolver, repo } = await setup();
    const now = new Date();

    // Subscription failed payment 1 day ago -> PAST_DUE
    const sub = await repo.createSubscription({
      customerId: "cust_past_due",
      planId: "plan_pro",
      status: "PAST_DUE",
      currentPeriodStart: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: now,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      trialStart: null,
      trialEnd: null,
      provider: "stripe",
      providerSubscriptionId: "sub_past_due",
      version: 1,
    });

    // Sub updatedAt is now -> Within 3-day grace period!
    const entWithinGrace = await resolver.resolveEntitlement("cust_past_due");
    expect(entWithinGrace.hasAccess).toBe(true);
    expect(entWithinGrace.inGracePeriod).toBe(true);
    expect(await resolver.hasFeature("cust_past_due", "feature_analytics")).toBe(true);

    // Simulate 4 days elapsed past grace period
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    await repo.updateSubscription(sub.id, { updatedAt: fourDaysAgo });

    const entAfterGrace = await resolver.resolveEntitlement("cust_past_due");
    expect(entAfterGrace.planId).toBe("free");
    expect(entAfterGrace.inGracePeriod).toBe(false);
    expect(await resolver.hasFeature("cust_past_due", "feature_analytics")).toBe(false);
  });
});
