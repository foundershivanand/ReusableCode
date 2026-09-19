import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { VariantDefinition } from "../schemas/experiment-schemas.js";
import { ExperimentationClient } from "./experimentation-client.js";

export interface ExperimentationContextValue {
  getVariant: (experimentKey: string) => Promise<VariantDefinition | null>;
  trackExposure: (experimentKey: string) => Promise<void>;
  trackConversion: (experimentKey: string, metricName: string, value?: number) => Promise<void>;
  userId: string;
}

const ExperimentationContext = createContext<ExperimentationContextValue | null>(null);

export interface ExperimentationProviderProps {
  client?: ExperimentationClient;
  userId: string;
  context?: Record<string, unknown>;
  children: React.ReactNode;
}

export const ExperimentationProvider: React.FC<ExperimentationProviderProps> = ({
  client,
  userId,
  context = {},
  children,
}) => {
  const expClient = useMemo(() => client || new ExperimentationClient(), [client]);

  const getVariant = useCallback(
    async (experimentKey: string): Promise<VariantDefinition | null> => {
      const res = await expClient.getVariant(experimentKey, userId, context);
      return res.variant;
    },
    [expClient, userId, context]
  );

  const trackExposure = useCallback(
    async (experimentKey: string): Promise<void> => {
      await expClient.trackExposure(experimentKey, userId);
    },
    [expClient, userId]
  );

  const trackConversion = useCallback(
    async (experimentKey: string, metricName: string, value?: number): Promise<void> => {
      await expClient.trackConversion(experimentKey, userId, metricName, value);
    },
    [expClient, userId]
  );

  return (
    <ExperimentationContext.Provider
      value={{
        getVariant,
        trackExposure,
        trackConversion,
        userId,
      }}
    >
      {children}
    </ExperimentationContext.Provider>
  );
};

export function useExperimentationContext(): ExperimentationContextValue {
  const ctx = useContext(ExperimentationContext);
  if (!ctx) {
    throw new Error("useExperimentationContext must be used within an ExperimentationProvider");
  }
  return ctx;
}
