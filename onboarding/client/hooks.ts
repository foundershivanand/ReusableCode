import { useOnboarding } from "./react-context.js";
import type { OnboardingStep, StepStatus } from "../schemas/onboarding-schemas.js";

export { useOnboarding };

export function useOnboardingProgress() {
  const { state, steps } = useOnboarding();
  const progress = state?.progressPercentage || 0;
  const isCompleted = state?.status === "COMPLETED";
  const isSkipped = state?.status === "SKIPPED";
  const currentStep = steps[state?.currentStepIndex || 0] || null;

  return {
    progress,
    isCompleted,
    isSkipped,
    currentStep,
    totalSteps: steps.length
  };
}

export function useStepStatus(stepId: string): {
  status: StepStatus;
  isCompleted: boolean;
  isServerVerified: boolean;
} {
  const { state } = useOnboarding();
  const stepState = state?.stepStates?.[stepId];

  return {
    status: stepState?.status || "PENDING",
    isCompleted: stepState?.status === "COMPLETED",
    isServerVerified: !!stepState?.serverVerified
  };
}
