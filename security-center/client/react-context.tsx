import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  SecurityFinding,
  SecurityEvent,
  SecurityPostureScore,
  SuppressionInput,
  FindingLifecycleState,
} from "../schemas/security-schemas.js";
import { SecurityClient } from "./security-client.js";

export interface SecurityCenterContextValue {
  findings: SecurityFinding[];
  score: SecurityPostureScore | null;
  events: SecurityEvent[];
  loading: boolean;
  updateFindingState: (id: string, state: FindingLifecycleState) => Promise<void>;
  suppressFinding: (input: SuppressionInput) => Promise<void>;
  refresh: () => Promise<void>;
}

const SecurityCenterContext = createContext<SecurityCenterContextValue | null>(null);

export interface SecurityCenterProviderProps {
  client?: SecurityClient;
  children: React.ReactNode;
}

export const SecurityCenterProvider: React.FC<SecurityCenterProviderProps> = ({
  client,
  children,
}) => {
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [score, setScore] = useState<SecurityPostureScore | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const secClient = useMemo(() => client || new SecurityClient(), [client]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [fList, sData, eList] = await Promise.all([
        secClient.getFindings({ includeSuppressed: false }),
        secClient.getPostureScore(),
        secClient.getEvents(20),
      ]);
      setFindings(fList);
      setScore(sData);
      setEvents(eList);
    } catch {
      // Graceful degradation
    } finally {
      setLoading(false);
    }
  }, [secClient]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateFindingState = useCallback(
    async (id: string, state: FindingLifecycleState) => {
      await secClient.updateFindingState(id, state);
      await refresh();
    },
    [secClient, refresh]
  );

  const suppressFinding = useCallback(
    async (input: SuppressionInput) => {
      await secClient.suppressFinding(input);
      await refresh();
    },
    [secClient, refresh]
  );

  return (
    <SecurityCenterContext.Provider
      value={{
        findings,
        score,
        events,
        loading,
        updateFindingState,
        suppressFinding,
        refresh,
      }}
    >
      {children}
    </SecurityCenterContext.Provider>
  );
};

export function useSecurityCenterContext(): SecurityCenterContextValue {
  const ctx = useContext(SecurityCenterContext);
  if (!ctx) {
    throw new Error("useSecurityCenterContext must be used within a SecurityCenterProvider");
  }
  return ctx;
}
