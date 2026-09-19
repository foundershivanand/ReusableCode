import React, { createContext, useContext, useState } from "react";
import { PortabilityClient } from "./portability-client.js";
import type { ExportJob, ImportJob, ExportFormat, ImportStrategy } from "../schemas/portability-schemas.js";

interface PortabilityContextValue {
  client: PortabilityClient;
  activeExport: ExportJob | null;
  activeImport: ImportJob | null;
  isLoading: boolean;
  error: string | null;
  triggerExport: (resourceType: string, format?: ExportFormat) => Promise<ExportJob>;
  triggerImport: (resourceType: string, content: string, dryRun?: boolean, strategy?: ImportStrategy) => Promise<ImportJob>;
}

const PortabilityContext = createContext<PortabilityContextValue | null>(null);

export interface PortabilityProviderProps {
  client?: PortabilityClient;
  tenantId: string;
  userId: string;
  children: React.ReactNode;
}

export const PortabilityProvider: React.FC<PortabilityProviderProps> = ({
  client = new PortabilityClient(),
  tenantId,
  userId,
  children
}) => {
  const [activeExport, setActiveExport] = useState<ExportJob | null>(null);
  const [activeImport, setActiveImport] = useState<ImportJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerExport = async (resourceType: string, format: ExportFormat = "CSV") => {
    try {
      setIsLoading(true);
      setError(null);
      const job = await client.requestExport({
        tenantId,
        userId,
        resourceType,
        format
      });
      setActiveExport(job);
      return job;
    } catch (err: any) {
      setError(err.message || "Export failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const triggerImport = async (
    resourceType: string,
    content: string,
    dryRun: boolean = false,
    strategy: ImportStrategy = "ALL_OR_NOTHING"
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      const job = await client.startImport({
        tenantId,
        userId,
        resourceType,
        content,
        dryRun,
        strategy
      });
      setActiveImport(job);
      return job;
    } catch (err: any) {
      setError(err.message || "Import failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PortabilityContext.Provider
      value={{
        client,
        activeExport,
        activeImport,
        isLoading,
        error,
        triggerExport,
        triggerImport
      }}
    >
      {children}
    </PortabilityContext.Provider>
  );
};

export const usePortability = (): PortabilityContextValue => {
  const ctx = useContext(PortabilityContext);
  if (!ctx) {
    throw new Error("usePortability must be used within a PortabilityProvider");
  }
  return ctx;
};
