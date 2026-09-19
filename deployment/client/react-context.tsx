import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { DeploymentMetadata, SanitizedConfigItem, ConfigDriftFinding } from "../schemas/deployment-schemas.js";
import { DeploymentClient } from "./deployment-client.js";

export interface DeploymentContextValue {
  metadata: DeploymentMetadata | null;
  configItems: SanitizedConfigItem[];
  driftFindings: ConfigDriftFinding[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const DeploymentContext = createContext<DeploymentContextValue | null>(null);

export interface DeploymentProviderProps {
  client?: DeploymentClient;
  children: React.ReactNode;
}

export const DeploymentProvider: React.FC<DeploymentProviderProps> = ({
  client,
  children,
}) => {
  const [metadata, setMetadata] = useState<DeploymentMetadata | null>(null);
  const [configItems, setConfigItems] = useState<SanitizedConfigItem[]>([]);
  const [driftFindings, setDriftFindings] = useState<ConfigDriftFinding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const deploymentClient = useMemo(() => client || new DeploymentClient(), [client]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [meta, configs, drift] = await Promise.all([
        deploymentClient.getMetadata(),
        deploymentClient.getSanitizedConfig(),
        deploymentClient.getDriftAudit(),
      ]);
      setMetadata(meta);
      setConfigItems(configs);
      setDriftFindings(drift);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [deploymentClient]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <DeploymentContext.Provider
      value={{
        metadata,
        configItems,
        driftFindings,
        loading,
        refresh,
      }}
    >
      {children}
    </DeploymentContext.Provider>
  );
};

export function useDeploymentContext(): DeploymentContextValue {
  const ctx = useContext(DeploymentContext);
  if (!ctx) {
    throw new Error("useDeploymentContext must be used within a DeploymentProvider");
  }
  return ctx;
}
