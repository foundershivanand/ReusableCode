import { describe, expect, it } from "vitest";
import { BillingService } from "../server/billing-service.js";
import { InMemoryBillingRepository } from "../server/repository.js";
import { Plan } from "../schemas/billing-schemas.js";

describe("Subscription Engine & APIs (Page 13-14)", () => {
  async function setup() {
    const repo = new InMemoryBillingRepository();
    const billing = new BillingService(repo);

    const proPlan: Plan = {
      id: "plan_pro",
      name: "Pro Plan",
      description: "For professionals",
      amountMinorUnits: 2900, // $29.00
      currency: "USD",
      interval: "month",
      trialDays: 14,
      features: ["feature_analytics", "feature_export", "feature_priority_support"],
      limits: { projects: 10, team_members: 5 },
      isActive: true,
    };

    await repo.createPlan(proPlan);

    await repo.createCustomer({
      id: "cust_123",
      email: "billing@example.com",
      name: "Billing User",
      createdAt: new Date(),
    });

    return { repo, billing, proPlan };
  }

  it("creates checkout session and applies coupon discounts", async () => {
    const { billing, repo } = await setup();

    // Create 20% off coupon
    await repo.createCoupon({
      code: "SAVE20",
      discountType: "percentage",
      value: 20,
      maxRedemptions: 100,
      redemptionsCount: 0,
      expiresAt: null,
      isActive: true,
    });

    const checkout = await billing.createCheckout({
      planId: "plan_pro",
      customerId: "cust_123",
      successUrl: "https://app.example.com/success",
      cancelUrl: "https://app.example.com/cancel",
      couponCode: "SAVE20",
      billingAddress: {
        line1: "123 Main St",
        city: "San Francisco",
        state: "CA",
        postalCode: "94105",
        country: "US",
      },
    });

    expect(checkout.checkoutUrl).toBeDefined();
    expect(checkout.sessionId).toBeDefined();

    // Check that an open invoice was created with discount applied
    const invoices = await billing.listCustomerInvoices("cust_123");
    expect(invoices.length).toBe(1);
    expect(invoices[0].discountMinorUnits).toBe(580); // 20% of 2900 = 580
  });

  it("manages subscription lifecycle: active, scheduled cancellation, and resume", async () => {
    const { billing, repo } = await setup();

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Create active subscription
    await repo.createSubscription({
      customerId: "cust_123",
      planId: "plan_pro",
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      trialStart: null,
      trialEnd: null,
      provider: "stripe",
      providerSubscriptionId: "sub_stripe_123",
      version: 1,
    });

    // 1. Application code queries
    expect(await billing.hasActivePlan("cust_123")).toBe(true);
    expect(await billing.hasFeature("cust_123", "feature_analytics")).toBe(true);
    expect(await billing.hasFeature("cust_123", "nonexistent_feature")).toBe(false);
    expect(await billing.getPlanLimit("cust_123", "projects")).toBe(10);

    // 2. Schedule cancellation at period end
    const canceledSub = await billing.cancelSubscription("cust_123", false);
    expect(canceledSub.cancelAtPeriodEnd).toBe(true);
    expect(canceledSub.status).toBe("ACTIVE"); // Stays active until period end!
    expect(await billing.hasActivePlan("cust_123")).toBe(true);

    // 3. Resume subscription
    const resumedSub = await billing.resumeSubscription("cust_123");
    expect(resumedSub.cancelAtPeriodEnd).toBe(false);
  });

  it("supports pausing and immediate cancellation", async () => {
    const { billing, repo } = await setup();
    const now = new Date();

    await repo.createSubscription({
      customerId: "cust_123",
      planId: "plan_pro",
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      canceledAt: null,
      trialStart: null,
      trialEnd: null,
      provider: "stripe",
      providerSubscriptionId: "sub_stripe_123",
      version: 1,
    });

    // Pause subscription
    const paused = await billing.pauseSubscription("cust_123");
    expect(paused.status).toBe("PAUSED");

    // Immediate cancellation
    const canceled = await billing.cancelSubscription("cust_123", true);
    expect(canceled.status).toBe("CANCELED");
    expect(await billing.hasActivePlan("cust_123")).toBe(false);
  });
});
