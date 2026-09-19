import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AuditClient } from "./audit-client.js";
import type { AuditLogEntry, AuditQueryFilter } from "../schemas/audit-schemas.js";

interface AuditContextValue {
  client: AuditClient;
  logs: AuditLogEntry[];
  isLoading: boolean;
  error: string | null;
  filter: AuditQueryFilter;
  setFilter: React.Dispatch<React.SetStateAction<AuditQueryFilter>>;
  refresh: () => Promise<void>;
  verifyIntegrity: () => Promise<{ valid: boolean; compromisedIndex?: number }>;
}

const AuditContext = createContext<AuditContextValue | null>(null);

export interface AuditProviderProps {
  client?: AuditClient;
  tenantId: string;
  initialFilter?: Partial<AuditQueryFilter>;
  children: React.ReactNode;
}

export const AuditProvider: React.FC<AuditProviderProps> = ({
  client = new AuditClient(),
  tenantId,
  initialFilter,
  children
}) => {
  const [filter, setFilter] = useState<AuditQueryFilter>({
    tenantId,
    limit: 50,
    ...initialFilter
  });
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await client.queryLogs(filter);
      setLogs(res.entries);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  }, [client, filter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const verifyIntegrity = async () => {
    return client.verifyIntegrity(tenantId);
  };

  return (
    <AuditContext.Provider
      value={{
        client,
        logs,
        isLoading,
        error,
        filter,
        setFilter,
        refresh,
        verifyIntegrity
      }}
    >
      {children}
    </AuditContext.Provider>
  );
};

export const useAudit = (): AuditContextValue => {
  const ctx = useContext(AuditContext);
  if (!ctx) {
    throw new Error("useAudit must be used within an AuditProvider");
  }
  return ctx;
};
