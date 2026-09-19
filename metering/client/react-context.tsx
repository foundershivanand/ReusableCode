import React, { createContext, useContext, useMemo } from "react";
import { MeteringClient } from "./metering-client.js";

interface MeteringContextValue {
  client: MeteringClient;
  tenantId: string;
}

const MeteringContext = createContext<MeteringContextValue | null>(null);

export interface MeteringProviderProps {
  client?: MeteringClient;
  tenantId: string;
  baseUrl?: string;
  children: React.ReactNode;
}

export const MeteringProvider: React.FC<MeteringProviderProps> = ({
  client,
  tenantId,
  baseUrl,
  children,
}) => {
  const meteringClient = useMemo(() => {
    return client || new MeteringClient(baseUrl);
  }, [client, baseUrl]);

  return (
    <MeteringContext.Provider value={{ client: meteringClient, tenantId }}>
      {children}
    </MeteringContext.Provider>
  );
};

export function useMeteringContext(): MeteringContextValue {
  const ctx = useContext(MeteringContext);
  if (!ctx) {
    throw new Error("useMeteringContext must be used within a MeteringProvider");
  }
  return ctx;
}
