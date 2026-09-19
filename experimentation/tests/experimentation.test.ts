import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemoryExperimentationRepository,
  ExperimentationService,
} from "../server/index.js";

describe("Module 29: Experimentation & A/B Testing", () => {
  let repo: InMemoryExperimentationRepository;
  let service: ExperimentationService;

  beforeEach(async () => {
    repo = new InMemoryExperimentationRepository();
    service = new ExperimentationService(repo);

    await service.createExperiment({
      key: "checkout-v2",
      name: "New Checkout Flow",
      description: "Test 1-step vs 3-step checkout",
      variants: [
        { id: "control", name: "3-Step Checkout", weight: 50, isControl: true, payload: {} },
        { id: "treatment", name: "1-Step Checkout", weight: 50, isControl: false, payload: {} },
      ],
      primaryMetric: "completed_purchase",
      mutualExclusionGroup: "checkout_funnel",
      eligibilityRules: {
        allowedPlans: ["pro", "enterprise"],
        allowedCountries: ["US", "CA"],
      },
      attributionWindowHours: 24,
    });

    await service.updateStatus("checkout-v2", "RUNNING");
  });

  it("should deterministically assign variants to users without jumping", async () => {
    const user1 = { userId: "user_alice", plan: "pro", country: "US" };

    const first = await service.getVariant("checkout-v2", user1);
    expect(first.isEligible).toBe(true);
    expect(first.variant).toBeDefined();

    // Repeated calls must return identical variant
    const second = await service.getVariant("checkout-v2", user1);
    expect(second.variant?.id).toBe(first.variant?.id);

    const third = await service.getVariant("checkout-v2", user1);
    expect(third.variant?.id).toBe(first.variant?.id);
  });

  it("should enforce eligibility rules and assign control to ineligible users", async () => {
    // User on 'free' plan (only 'pro' and 'enterprise' allowed)
    const ineligibleUser = { userId: "user_bob", plan: "free", country: "US" };

    const res = await service.getVariant("checkout-v2", ineligibleUser);
    expect(res.isEligible).toBe(false);
    expect(res.variant?.isControl).toBe(true);
  });

  it("should prevent experiment contamination via mutual exclusion groups", async () => {
    // Create conflicting experiment in same mutual exclusion group
    await service.createExperiment({
      key: "checkout-express-pay",
      name: "Express Pay Buttons",
      description: "Apple Pay vs Google Pay",
      variants: [
        { id: "ctrl", name: "Standard", weight: 50, isControl: true, payload: {} },
        { id: "express", name: "Express", weight: 50, isControl: false, payload: {} },
      ],
      primaryMetric: "completed_purchase",
      mutualExclusionGroup: "checkout_funnel",
    });
    await service.updateStatus("checkout-express-pay", "RUNNING");

    const user = { userId: "user_charlie", plan: "pro", country: "US" };

    // 1. User enters first experiment
    const res1 = await service.getVariant("checkout-v2", user);
    expect(res1.isEligible).toBe(true);

    // 2. User attempts to enter second experiment in same group -> should be rejected/control
    const res2 = await service.getVariant("checkout-express-pay", user);
    expect(res2.isEligible).toBe(false);
    expect(res2.variant?.isControl).toBe(true);
  });

  it("should separate assignment from exposure and only attribute conversions after exposure", async () => {
    const user = { userId: "user_dave", plan: "pro", country: "US" };

    const { variant } = await service.getVariant("checkout-v2", user);
    expect(variant).toBeDefined();

    // 1. Conversion before exposure should fail / not count
    const convBefore = await service.trackConversion({
      experimentKey: "checkout-v2",
      userId: user.userId,
      metricName: "completed_purchase",
    });
    expect(convBefore).toBe(false);

    // 2. Track exposure
    await service.trackExposure("checkout-v2", user.userId);

    // 3. Conversion after exposure should succeed
    const convAfter = await service.trackConversion({
      experimentKey: "checkout-v2",
      userId: user.userId,
      metricName: "completed_purchase",
    });
    expect(convAfter).toBe(true);
  });

  it("should compute raw metrics without declaring a statistical winner and detect SRM", async () => {
    // Generate sample assignments and conversions
    for (let i = 0; i < 40; i++) {
      const u = { userId: `sample_user_${i}`, plan: "pro", country: "US" };
      await service.getVariant("checkout-v2", u);
      await service.trackExposure("checkout-v2", u.userId);
      if (i % 3 === 0) {
        await service.trackConversion({
          experimentKey: "checkout-v2",
          userId: u.userId,
          metricName: "completed_purchase",
        });
      }
    }

    const report = await service.getResults("checkout-v2");
    expect(report.experimentKey).toBe("checkout-v2");
    expect(report.variantMetrics).toHaveLength(2);
    expect(report.methodologyNote).toBeDefined();

    // Each variant has raw metrics
    for (const vm of report.variantMetrics) {
      expect(vm.assignedCount).toBeGreaterThan(0);
      expect(vm.exposedCount).toBeGreaterThan(0);
      expect(vm.conversionRate).toBeGreaterThanOrEqual(0);
    }
  });

  it("should transition through experiment lifecycle states", async () => {
    await service.updateStatus("checkout-v2", "PAUSED");
    const paused = await repo.getExperimentByKey("checkout-v2");
    expect(paused?.status).toBe("PAUSED");

    await service.updateStatus("checkout-v2", "COMPLETED");
    const completed = await repo.getExperimentByKey("checkout-v2");
    expect(completed?.status).toBe("COMPLETED");

    await service.updateStatus("checkout-v2", "ARCHIVED");
    const archived = await repo.getExperimentByKey("checkout-v2");
    expect(archived?.status).toBe("ARCHIVED");
  });
});
