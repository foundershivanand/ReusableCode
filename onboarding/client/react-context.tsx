import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { OnboardingClient } from "./onboarding-client.js";
import type {
  OnboardingFlow,
  UserOnboardingState,
  OnboardingStep,
  TourStep
} from "../schemas/onboarding-schemas.js";

interface OnboardingContextValue {
  client: OnboardingClient;
  flow: OnboardingFlow | null;
  state: UserOnboardingState | null;
  steps: OnboardingStep[];
  isLoading: boolean;
  error: string | null;
  activeTourStep: TourStep | null;
  activeTourIndex: number;
  startFlow: () => Promise<void>;
  completeStep: (stepId: string, proof?: Record<string, any>) => Promise<void>;
  skipFlow: (reason?: string) => Promise<void>;
  startTour: (tourSteps: TourStep[]) => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  endTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export interface OnboardingProviderProps {
  client?: OnboardingClient;
  flowId: string;
  userId: string;
  tenantId: string;
  children: React.ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  client = new OnboardingClient(),
  flowId,
  userId,
  tenantId,
  children
}) => {
  const [flow, setFlow] = useState<OnboardingFlow | null>(null);
  const [state, setState] = useState<UserOnboardingState | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [tourSteps, setTourSteps] = useState<TourStep[]>([]);
  const [activeTourIndex, setActiveTourIndex] = useState<number>(-1);

  const reload = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [fetchedFlow, fetchedSteps, fetchedState] = await Promise.all([
        client.getFlow(flowId),
        client.getVisibleSteps(flowId),
        client.getUserState(flowId).catch(() => null)
      ]);
      setFlow(fetchedFlow);
      setSteps(fetchedSteps);
      setState(fetchedState);
    } catch (err: any) {
      setError(err.message || "Failed to load onboarding data");
    } finally {
      setIsLoading(false);
    }
  }, [client, flowId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const startFlow = async () => {
    try {
      const updated = await client.startOrResume(flowId);
      setState(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const completeStep = async (stepId: string, proof?: Record<string, any>) => {
    try {
      const updated = await client.completeStep({
        userId,
        tenantId,
        flowId,
        stepId,
        serverVerificationProof: proof
      });
      setState(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const skipFlow = async (reason?: string) => {
    try {
      const updated = await client.skipFlow({
        userId,
        tenantId,
        flowId,
        reason
      });
      setState(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startTour = (tourStepsList: TourStep[]) => {
    setTourSteps(tourStepsList);
    setActiveTourIndex(0);
  };

  const nextTourStep = () => {
    if (activeTourIndex < tourSteps.length - 1) {
      setActiveTourIndex((prev) => prev + 1);
    } else {
      endTour();
    }
  };

  const prevTourStep = () => {
    if (activeTourIndex > 0) {
      setActiveTourIndex((prev) => prev - 1);
    }
  };

  const endTour = () => {
    setActiveTourIndex(-1);
    setTourSteps([]);
  };

  const activeTourStep =
    activeTourIndex >= 0 && activeTourIndex < tourSteps.length
      ? tourSteps[activeTourIndex]
      : null;

  return (
    <OnboardingContext.Provider
      value={{
        client,
        flow,
        state,
        steps,
        isLoading,
        error,
        activeTourStep,
        activeTourIndex,
        startFlow,
        completeStep,
        skipFlow,
        startTour,
        nextTourStep,
        prevTourStep,
        endTour
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextValue => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return ctx;
};
