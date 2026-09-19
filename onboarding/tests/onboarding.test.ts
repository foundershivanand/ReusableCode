import { describe, it, expect, beforeEach } from "vitest";
import { OnboardingService } from "../server/onboarding-service.js";
import { InMemoryOnboardingRepository } from "../server/repository.js";
import type { OnboardingFlow } from "../schemas/onboarding-schemas.js";

describe("Module 11: Onboarding Infrastructure", () => {
  let repository: InMemoryOnboardingRepository;
  let service: OnboardingService;

  const sampleFlow: OnboardingFlow = {
    id: "default-onboarding",
    version: "v1",
    title: "Welcome Tour",
    description: "Get started with your account",
    targetRoles: [],
    productKey: "core",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    steps: [
      {
        id: "create-account",
        flowId: "default-onboarding",
        order: 0,
        title: "Create Account",
        description: "Your account is created",
        requiredRoles: [],
        metadata: {}
      },
      {
        id: "complete-profile",
        flowId: "default-onboarding",
        order: 1,
        title: "Complete Profile",
        description: "Add your full name and avatar",
        requiredRoles: [],
        metadata: {}
      },
      {
        id: "create-project",
        flowId: "default-onboarding",
        order: 2,
        title: "Create First Project",
        description: "Spin up a new project",
        requiredRoles: ["ADMIN", "MEMBER"],
        serverVerificationKey: "projectId",
        unlocksFeature: "projects",
        metadata: {}
      },
      {
        id: "invite-teammate",
        flowId: "default-onboarding",
        order: 3,
        title: "Invite Teammate",
        description: "Collaborate with your team",
        requiredRoles: ["ADMIN"],
        metadata: {}
      }
    ]
  };

  beforeEach(async () => {
    repository = new InMemoryOnboardingRepository();
    service = new OnboardingService(repository);
    await service.registerFlow(sampleFlow);
  });

  it("initializes onboarding flow with IN_PROGRESS and ordered pending steps", async () => {
    const state = await service.startOrResumeFlow("default-onboarding", {
      userId: "user_1",
      tenantId: "tenant_1",
      roles: ["ADMIN"]
    });

    expect(state.status).toBe("IN_PROGRESS");
    expect(state.progressPercentage).toBe(0);
    expect(state.stepStates["create-account"]?.status).toBe("PENDING");
    expect(state.currentStepIndex).toBe(0);
  });

  it("filters steps based on user roles and permissions", async () => {
    const adminSteps = await service.getVisibleStepsForUser("default-onboarding", {
      userId: "user_1",
      tenantId: "tenant_1",
      roles: ["ADMIN"]
    });
    expect(adminSteps.length).toBe(4);

    const viewerSteps = await service.getVisibleStepsForUser("default-onboarding", {
      userId: "user_2",
      tenantId: "tenant_1",
      roles: ["VIEWER"]
    });
    // VIEWER cannot see create-project (requires ADMIN/MEMBER) or invite-teammate (requires ADMIN)
    expect(viewerSteps.length).toBe(2);
    expect(viewerSteps.map((s) => s.id)).toEqual(["create-account", "complete-profile"]);
  });

  it("enforces server-side verification for critical completion steps", async () => {
    // Missing required proof
    await expect(
      service.completeStep({
        userId: "user_1",
        tenantId: "tenant_1",
        flowId: "default-onboarding",
        stepId: "create-project"
      })
    ).rejects.toThrow(/Server-side verification failed/);

    // With valid verification proof
    const updated = await service.completeStep({
      userId: "user_1",
      tenantId: "tenant_1",
      flowId: "default-onboarding",
      stepId: "create-project",
      serverVerificationProof: { projectId: "proj_123" }
    });

    expect(updated.stepStates["create-project"]?.status).toBe("COMPLETED");
    expect(updated.stepStates["create-project"]?.serverVerified).toBe(true);
  });

  it("calculates progress percentage and completes flow when all steps finish", async () => {
    const userCtx = {
      userId: "user_3",
      tenantId: "tenant_1",
      roles: ["VIEWER"]
    };

    // Complete step 1
    const s1 = await service.completeStep(
      {
        userId: "user_3",
        tenantId: "tenant_1",
        flowId: "default-onboarding",
        stepId: "create-account"
      },
      userCtx
    );
    expect(s1.progressPercentage).toBe(50);
    expect(s1.status).toBe("IN_PROGRESS");

    // Complete step 2
    const s2 = await service.completeStep(
      {
        userId: "user_3",
        tenantId: "tenant_1",
        flowId: "default-onboarding",
        stepId: "complete-profile"
      },
      userCtx
    );
    expect(s2.progressPercentage).toBe(100);
    expect(s2.status).toBe("COMPLETED");
    expect(s2.completedAt).toBeDefined();
  });

  it("migrates flow version without losing existing user step progress", async () => {
    const userCtx = { userId: "user_4", tenantId: "tenant_1", roles: ["ADMIN"] };
    await service.completeStep(
      {
        userId: "user_4",
        tenantId: "tenant_1",
        flowId: "default-onboarding",
        stepId: "create-account"
      },
      userCtx
    );

    // Register flow v2 with an extra step
    const flowV2: OnboardingFlow = {
      ...sampleFlow,
      version: "v2",
      steps: [
        ...sampleFlow.steps,
        {
          id: "connect-domain",
          flowId: "default-onboarding",
          order: 4,
          title: "Connect Custom Domain",
          description: "Point your DNS",
          requiredRoles: ["ADMIN"],
          metadata: {}
        }
      ]
    };
    await service.registerFlow(flowV2);

    // Resume flow in v2
    const resumed = await service.startOrResumeFlow("default-onboarding", userCtx);
    expect(resumed.flowVersion).toBe("v2");
    // Prior progress is retained!
    expect(resumed.stepStates["create-account"]?.status).toBe("COMPLETED");
    // New step is added as PENDING
    expect(resumed.stepStates["connect-domain"]?.status).toBe("PENDING");
  });

  it("handles skipping and resetting onboarding flows cleanly", async () => {
    const skipped = await service.skipFlow({
      userId: "user_5",
      tenantId: "tenant_1",
      flowId: "default-onboarding",
      reason: "Experienced user"
    });
    expect(skipped.status).toBe("SKIPPED");
    expect(skipped.skippedAt).toBeDefined();

    const reset = await service.resetFlow("user_5", "default-onboarding", "tenant_1");
    expect(reset.status).toBe("RESET");
  });
});
