import React, { createContext, useContext, useState, useEffect } from "react";
import type { TenantContext, TenantPermission } from "../schemas/index.js";
import { TenancyClient } from "./tenancy-client.js";
import { can as canCheck } from "../server/permissions.js";

interface TenancyContextValue {
  client: TenancyClient;
  context: TenantContext | null;
  loading: boolean;
  error: Error | null;
  refreshContext: () => Promise<void>;
  can: (permission: TenantPermission) => boolean;
}

const TenancyReactContext = createContext<TenancyContextValue | null>(null);

export interface TenancyProviderProps {
  client: TenancyClient;
  children: React.ReactNode;
  initialContext?: TenantContext;
}

export const TenancyProvider: React.FC<TenancyProviderProps> = ({ client, children, initialContext }) => {
  const [context, setContext] = useState<TenantContext | null>(initialContext || null);
  const [loading, setLoading] = useState<boolean>(!initialContext);
  const [error, setError] = useState<Error | null>(null);

  const refreshContext = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.getContext();
      setContext(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialContext) {
      refreshContext();
    }
  }, [client]);

  const can = (permission: TenantPermission): boolean => {
    if (!context) return false;
    return canCheck(context, permission);
  };

  return (
    <TenancyReactContext.Provider value={{ client, context, loading, error, refreshContext, can }}>
      {children}
    </TenancyReactContext.Provider>
  );
};

export function useTenancyContext(): TenancyContextValue {
  const ctx = useContext(TenancyReactContext);
  if (!ctx) {
    throw new Error("useTenancyContext must be used within a TenancyProvider");
  }
  return ctx;
}
