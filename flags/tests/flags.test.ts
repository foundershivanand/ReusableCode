import { describe, it, expect, beforeEach } from "vitest";
import { FeatureFlagService } from "../server/flag-service.js";
import { InMemoryFeatureFlagRepository } from "../server/repository.js";
import type { FeatureFlag } from "../schemas/flag-schemas.js";

describe("Module 12: Feature Flags & Remote Configuration", () => {
  let repository: InMemoryFeatureFlagRepository;
  let service: FeatureFlagService;

  const baseFlag: FeatureFlag = {
    key: "ai-streaming",
    name: "AI Response Streaming",
    description: "Enables real-time token streaming",
    enabled: true,
    isKillSwitch: false,
    failClosed: true,
    percentageRollout: 100,
    targetingRules: [],
    dependencies: [],
    owner: "ai-team",
    lifecycleState: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    repository = new InMemoryFeatureFlagRepository();
    service = new FeatureFlagService(repository);
    await service.createFlag(baseFlag, "admin_user");
  });

  it("evaluates a globally enabled flag as true", async () => {
    const isEnabled = await service.hasFeature("ai-streaming", {
      userId: "u1",
      environment: "production",
      attributes: {}
    });
    expect(isEnabled).toBe(true);
  });

  it("returns safe default when flag does not exist", async () => {
    const isEnabled = await service.hasFeature(
      "non-existent-flag",
      { environment: "production", attributes: {} },
      false
    );
    expect(isEnabled).toBe(false);

    const evalResult = await service.evaluateFlag(
      "non-existent-flag",
      { environment: "production", attributes: {} },
      false
    );
    expect(evalResult.isDefault).toBe(true);
  });

  it("enforces kill switch to fail closed when flag is disabled", async () => {
    await service.createFlag(
      {
        ...baseFlag,
        key: "emergency-payment-switch",
        enabled: false,
        isKillSwitch: true,
        failClosed: true
      },
      "super_admin"
    );

    const res = await service.evaluateFlag("emergency-payment-switch");
    expect(res.enabled).toBe(false);
    expect(res.reason).toBe("KILL_SWITCH_ACTIVE");
  });

  it("evaluates percentage rollout consistently based on distinct user ID", async () => {
    await service.createFlag(
      {
        ...baseFlag,
        key: "gradual-feature",
        percentageRollout: 50
      },
      "product_manager"
    );

    // Repeated evaluations for the same user must be identical (stickiness)
    const res1 = await service.hasFeature("gradual-feature", {
      userId: "user_alpha",
      environment: "production",
      attributes: {}
    });
    const res2 = await service.hasFeature("gradual-feature", {
      userId: "user_alpha",
      environment: "production",
      attributes: {}
    });
    expect(res1).toBe(res2);
  });

  it("evaluates targeting rules by role and plan", async () => {
    await service.createFlag(
      {
        ...baseFlag,
        key: "enterprise-export",
        targetingRules: [
          { attribute: "plan", operator: "IN", values: ["enterprise", "custom"] },
          { attribute: "role", operator: "EQUALS", values: ["ADMIN"] }
        ]
      },
      "admin"
    );

    const denied = await service.hasFeature("enterprise-export", {
      userId: "u1",
      plan: "starter",
      role: "MEMBER",
      environment: "production",
      attributes: {}
    });
    expect(denied).toBe(false);

    const allowed = await service.hasFeature("enterprise-export", {
      userId: "u1",
      plan: "enterprise",
      role: "ADMIN",
      environment: "production",
      attributes: {}
    });
    expect(allowed).toBe(true);
  });

  it("evaluates flag dependencies explicitly", async () => {
    await service.createFlag(
      {
        ...baseFlag,
        key: "parent-flag",
        enabled: false
      },
      "admin"
    );

    await service.createFlag(
      {
        ...baseFlag,
        key: "child-flag",
        enabled: true,
        dependencies: ["parent-flag"]
      },
      "admin"
    );

    // Child is enabled, but parent is disabled -> evaluation should fail
    const childRes = await service.evaluateFlag("child-flag");
    expect(childRes.enabled).toBe(false);
    expect(childRes.reason).toBe("DEPENDENCY_UNSATISFIED:parent-flag");

    // Enable parent -> child now evaluates to true
    await service.toggleFlag("parent-flag", true, "admin");
    const childResAfter = await service.evaluateFlag("child-flag");
    expect(childResAfter.enabled).toBe(true);
  });

  it("records audit logs for all mutations (create, toggle, rollout, delete)", async () => {
    await service.toggleFlag("ai-streaming", false, "admin_shiva");
    await service.setRollout("ai-streaming", 25, "admin_shiva");
    await service.deleteFlag("ai-streaming", "admin_shiva");

    const audits = await service.getAuditLog("ai-streaming");
    expect(audits.length).toBe(4); // CREATE, TOGGLE, ROLLOUT_CHANGE, DELETE
    expect(audits.map((a) => a.action)).toEqual([
      "CREATE",
      "TOGGLE",
      "ROLLOUT_CHANGE",
      "DELETE"
    ]);
  });
});
