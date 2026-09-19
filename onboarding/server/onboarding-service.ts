import type { IOnboardingRepository } from "./repository.js";
import {
  type OnboardingFlow,
  type UserOnboardingState,
  type CompleteStepInput,
  type SkipFlowInput,
  type OnboardingStep,
  CompleteStepInputSchema,
  SkipFlowInputSchema,
  OnboardingFlowSchema
} from "../schemas/onboarding-schemas.js";

export interface OnboardingUserContext {
  userId: string;
  tenantId: string;
  roles?: string[];
  permissions?: string[];
}

export class OnboardingService {
  constructor(private readonly repository: IOnboardingRepository) {}

  async registerFlow(flowInput: unknown): Promise<OnboardingFlow> {
    const validated = OnboardingFlowSchema.parse(flowInput);
    return this.repository.saveFlow(validated);
  }

  async getFlow(flowId: string): Promise<OnboardingFlow | null> {
    return this.repository.getFlow(flowId);
  }

  async getVisibleStepsForUser(
    flowId: string,
    context: OnboardingUserContext
  ): Promise<OnboardingStep[]> {
    const flow = await this.repository.getFlow(flowId);
    if (!flow) throw new Error(`Onboarding flow '${flowId}' not found`);

    const userRoles = new Set(context.roles || []);
    const userPermissions = new Set(context.permissions || []);

    return flow.steps
      .slice()
      .sort((a, b) => a.order - b.order)
      .filter((step) => {
        if (step.requiredRoles.length > 0) {
          const hasRole = step.requiredRoles.some((r) => userRoles.has(r));
          if (!hasRole) return false;
        }
        if (step.requiredPermission && !userPermissions.has(step.requiredPermission)) {
          return false;
        }
        return true;
      });
  }

  async startOrResumeFlow(
    flowId: string,
    context: OnboardingUserContext
  ): Promise<UserOnboardingState> {
    const flow = await this.repository.getFlow(flowId);
    if (!flow) throw new Error(`Onboarding flow '${flowId}' not found`);

    let userState = await this.repository.getUserState(context.userId, flowId);

    if (!userState) {
      // First time starting
      const initialStepStates: Record<string, any> = {};
      flow.steps.forEach((s) => {
        initialStepStates[s.id] = {
          stepId: s.id,
          status: "PENDING",
          serverVerified: false
        };
      });

      userState = {
        id: `${context.userId}:${flowId}`,
        userId: context.userId,
        tenantId: context.tenantId,
        flowId: flow.id,
        flowVersion: flow.version,
        status: "IN_PROGRESS",
        currentStepIndex: 0,
        stepStates: initialStepStates,
        progressPercentage: 0,
        startedAt: new Date(),
        lastResumedAt: new Date(),
        updatedAt: new Date()
      };

      return this.repository.saveUserState(userState);
    }

    // Version migration: if flow version is newer, retain completed steps and add any new steps
    if (userState.flowVersion !== flow.version) {
      const mergedStates = { ...userState.stepStates };
      flow.steps.forEach((s) => {
        if (!mergedStates[s.id]) {
          mergedStates[s.id] = {
            stepId: s.id,
            status: "PENDING",
            serverVerified: false
          };
        }
      });
      userState.flowVersion = flow.version;
      userState.stepStates = mergedStates;
    }

    // Resume interrupted session
    userState.lastResumedAt = new Date();
    if (userState.status === "NOT_STARTED") {
      userState.status = "IN_PROGRESS";
      userState.startedAt = new Date();
    }

    // Calculate current step index
    const visibleSteps = await this.getVisibleStepsForUser(flowId, context);
    let nextIndex = 0;
    for (let i = 0; i < visibleSteps.length; i++) {
      const stepId = visibleSteps[i].id;
      const state = userState.stepStates[stepId];
      if (!state || state.status !== "COMPLETED") {
        nextIndex = i;
        break;
      }
    }
    userState.currentStepIndex = nextIndex;

    return this.repository.saveUserState(userState);
  }

  async completeStep(input: CompleteStepInput, context?: OnboardingUserContext): Promise<UserOnboardingState> {
    const validated = CompleteStepInputSchema.parse(input);
    const flow = await this.repository.getFlow(validated.flowId);
    if (!flow) throw new Error(`Flow '${validated.flowId}' not found`);

    const step = flow.steps.find((s) => s.id === validated.stepId);
    if (!step) throw new Error(`Step '${validated.stepId}' not found in flow '${validated.flowId}'`);

    // Server-side verification check
    let isServerVerified = false;
    if (step.serverVerificationKey) {
      if (!validated.serverVerificationProof || !validated.serverVerificationProof[step.serverVerificationKey]) {
        throw new Error(
          `Server-side verification failed for step '${step.id}': proof '${step.serverVerificationKey}' required`
        );
      }
      isServerVerified = true;
    }

    let userState = await this.repository.getUserState(validated.userId, validated.flowId);
    if (!userState) {
      userState = await this.startOrResumeFlow(validated.flowId, {
        userId: validated.userId,
        tenantId: validated.tenantId,
        roles: context?.roles,
        permissions: context?.permissions
      });
    }

    userState.stepStates[step.id] = {
      stepId: step.id,
      status: "COMPLETED",
      completedAt: new Date(),
      serverVerified: isServerVerified,
      verificationProof: validated.serverVerificationProof
    };

    // Recalculate progress
    const visibleSteps = context
      ? await this.getVisibleStepsForUser(validated.flowId, context)
      : flow.steps;

    const completedCount = visibleSteps.filter(
      (s) => userState?.stepStates[s.id]?.status === "COMPLETED"
    ).length;

    userState.progressPercentage = Math.round((completedCount / visibleSteps.length) * 100);

    if (completedCount === visibleSteps.length) {
      userState.status = "COMPLETED";
      userState.completedAt = new Date();
    } else {
      userState.status = "IN_PROGRESS";
      const nextPendingIndex = visibleSteps.findIndex(
        (s) => userState?.stepStates[s.id]?.status !== "COMPLETED"
      );
      userState.currentStepIndex = nextPendingIndex >= 0 ? nextPendingIndex : visibleSteps.length - 1;
    }

    return this.repository.saveUserState(userState);
  }

  async skipFlow(input: SkipFlowInput): Promise<UserOnboardingState> {
    const validated = SkipFlowInputSchema.parse(input);
    let userState = await this.repository.getUserState(validated.userId, validated.flowId);
    if (!userState) {
      userState = await this.startOrResumeFlow(validated.flowId, {
        userId: validated.userId,
        tenantId: validated.tenantId
      });
    }

    userState.status = "SKIPPED";
    userState.skippedAt = new Date();
    return this.repository.saveUserState(userState);
  }

  async resetFlow(userId: string, flowId: string, tenantId: string): Promise<UserOnboardingState> {
    await this.repository.deleteUserState(userId, flowId);
    const newState = await this.startOrResumeFlow(flowId, { userId, tenantId });
    newState.status = "RESET";
    return this.repository.saveUserState(newState);
  }
}
