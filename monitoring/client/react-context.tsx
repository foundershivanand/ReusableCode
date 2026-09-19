import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { SystemHealthReport, Incident, SloDefinition } from "../schemas/monitoring-schemas.js";
import { MonitoringClient } from "./monitoring-client.js";

export interface MonitoringContextValue {
  health: SystemHealthReport | null;
  incidents: Incident[];
  slos: SloDefinition[];
  loading: boolean;
  refreshHealth: () => Promise<void>;
  refreshIncidents: () => Promise<void>;
}

const MonitoringContext = createContext<MonitoringContextValue | null>(null);

export interface MonitoringProviderProps {
  client?: MonitoringClient;
  isPublic?: boolean;
  pollIntervalMs?: number;
  children: React.ReactNode;
}

export const MonitoringProvider: React.FC<MonitoringProviderProps> = ({
  client,
  isPublic = true,
  pollIntervalMs = 30000,
  children,
}) => {
  const [health, setHealth] = useState<SystemHealthReport | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [slos, setSlos] = useState<SloDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const monitoringClient = useMemo(() => client || new MonitoringClient(), [client]);

  const refreshHealth = useCallback(async () => {
    try {
      const data = await monitoringClient.getHealth(isPublic);
      setHealth(data);
    } catch {
      // Graceful degradation
    }
  }, [monitoringClient, isPublic]);

  const refreshIncidents = useCallback(async () => {
    try {
      const inc = await monitoringClient.getIncidents();
      setIncidents(inc);
      const sloList = await monitoringClient.getSlos();
      setSlos(sloList);
    } catch {
      // Graceful degradation
    }
  }, [monitoringClient]);

  useEffect(() => {
    setLoading(true);
    Promise.all([refreshHealth(), refreshIncidents()]).finally(() => setLoading(false));

    if (pollIntervalMs > 0) {
      const interval = setInterval(() => {
        refreshHealth();
        refreshIncidents();
      }, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [refreshHealth, refreshIncidents, pollIntervalMs]);

  return (
    <MonitoringContext.Provider
      value={{
        health,
        incidents,
        slos,
        loading,
        refreshHealth,
        refreshIncidents,
      }}
    >
      {children}
    </MonitoringContext.Provider>
  );
};

export function useMonitoringContext(): MonitoringContextValue {
  const ctx = useContext(MonitoringContext);
  if (!ctx) {
    throw new Error("useMonitoringContext must be used within a MonitoringProvider");
  }
  return ctx;
}
