import { describe, expect, it } from "vitest";
import { FinancialReconciliationJob } from "../server/reconciliation-job.js";
import { InMemoryBillingRepository } from "../server/repository.js";

describe("Financial Reconciliation (Page 16)", () => {
  it("detects and reconciles status and plan drift between database and payment provider", async () => {
    const repo = new InMemoryBillingRepository();

    // Internal database has customer with ACTIVE subscription to 'plan_basic'
    await repo.createSubscription({
      customerId: "cust_drift_1",
      planId: "plan_basic",
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      canceledAt: null,
      trialStart: null,
      trialEnd: null,
      provider: "stripe",
      providerSubscriptionId: "sub_drift_1",
      version: 1,
    });

    // Provider client reports customer is actually CANCELED and on 'plan_pro'
    const mockProviderClient = {
      async fetchActiveSubscriptions() {
        return [
          {
            customerId: "cust_drift_1",
            providerSubscriptionId: "sub_drift_1",
            status: "canceled",
            planId: "plan_pro",
            currentPeriodEnd: new Date(),
          },
        ];
      },
    };

    const reconciliation = new FinancialReconciliationJob(repo, mockProviderClient);
    const result = await reconciliation.runReconciliation();

    expect(result.driftCount).toBe(2); // Status drift + Plan drift
    expect(result.drifts.map((d) => d.field)).toContain("status");
    expect(result.drifts.map((d) => d.field)).toContain("planId");

    // Internal record reconciled to match provider
    const sub = await repo.findActiveSubscriptionByCustomerId("cust_drift_1");
    // Since status reconciled to CANCELED, findActive should return null
    expect(sub).toBeNull();
  });
});
