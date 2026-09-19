import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { FeatureFlagsClient } from "./flags-client.js";
import type {
  FeatureFlag,
  EvaluationContext,
  EvaluationResult
} from "../schemas/flag-schemas.js";

interface FeatureFlagsContextValue {
  client: FeatureFlagsClient;
  flags: FeatureFlag[];
  isLoading: boolean;
  error: string | null;
  hasFeature: (key: string, defaultVal?: boolean) => boolean;
  getFlagConfig: (key: string) => Record<string, any> | undefined;
  refresh: () => Promise<void>;
  toggleFlag: (key: string, enabled: boolean) => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue | null>(null);

export interface FeatureFlagsProviderProps {
  client?: FeatureFlagsClient;
  context?: EvaluationContext;
  initialFlags?: FeatureFlag[];
  children: React.ReactNode;
}

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({
  client = new FeatureFlagsClient(),
  context = { environment: "production", attributes: {} },
  initialFlags = [],
  children
}) => {
  const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags);
  const [evaluations, setEvaluations] = useState<Record<string, EvaluationResult>>({});
  const [isLoading, setIsLoading] = useState<boolean>(initialFlags.length === 0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetched = await client.listFlags();
      setFlags(fetched);

      // Pre-evaluate active flags for this context
      const evals: Record<string, EvaluationResult> = {};
      for (const flag of fetched) {
        evals[flag.key] = await client.evaluate(flag.key, context);
      }
      setEvaluations(evals);
    } catch (err: any) {
      setError(err.message || "Failed to load feature flags");
    } finally {
      setIsLoading(false);
    }
  }, [client, context]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasFeature = (key: string, defaultVal: boolean = false): boolean => {
    if (evaluations[key]) {
      return evaluations[key].enabled;
    }
    const flag = flags.find((f) => f.key === key);
    return flag ? flag.enabled : defaultVal;
  };

  const getFlagConfig = (key: string) => {
    return evaluations[key]?.remoteConfig || flags.find((f) => f.key === key)?.remoteConfigValue;
  };

  const toggleFlag = async (key: string, enabled: boolean) => {
    try {
      const updated = await client.toggleFlag(key, enabled);
      setFlags((prev) => prev.map((f) => (f.key === key ? updated : f)));
      const evalResult = await client.evaluate(key, context);
      setEvaluations((prev) => ({ ...prev, [key]: evalResult }));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <FeatureFlagsContext.Provider
      value={{
        client,
        flags,
        isLoading,
        error,
        hasFeature,
        getFlagConfig,
        refresh,
        toggleFlag
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = (): FeatureFlagsContextValue => {
  const ctx = useContext(FeatureFlagsContext);
  if (!ctx) {
    throw new Error("useFeatureFlags must be used within a FeatureFlagsProvider");
  }
  return ctx;
};
