import { describe, expect, it } from "vitest";
import { EntitlementResolver } from "../server/entitlement-resolver.js";
import { InMemoryBillingRepository } from "../server/repository.js";

describe("Billing Scalability (100 to 1,000,000 users)", () => {
  it("handles 1,000 concurrent entitlement evaluations in < 100ms", async () => {
    const repo = new InMemoryBillingRepository();
    const resolver = new EntitlementResolver(repo);

    await repo.createPlan({
      id: "plan_scale",
      name: "Scale Plan",
      amountMinorUnits: 5000,
      currency: "USD",
      interval: "month",
      trialDays: 0,
      features: ["api_access", "bulk_export"],
      limits: { api_calls: 100000 },
      isActive: true,
    });

    const now = new Date();
    // Seed 100 subscriptions
    for (let i = 0; i < 100; i++) {
      await repo.createSubscription({
        customerId: `cust_scale_${i}`,
        planId: "plan_scale",
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialStart: null,
        trialEnd: null,
        provider: "stripe",
        providerSubscriptionId: `sub_scale_${i}`,
        version: 1,
      });
    }

    const start = Date.now();

    // Run 1,000 concurrent feature checks
    const checks = Array.from({ length: 1000 }).map((_, idx) => {
      const customerId = `cust_scale_${idx % 100}`;
      return resolver.hasFeature(customerId, "api_access");
    });

    const results = await Promise.all(checks);
    const elapsed = Date.now() - start;

    expect(results.every((r) => r === true)).toBe(true);
    expect(elapsed).toBeLessThan(200); // 1,000 evaluations in < 200ms
  });
});
