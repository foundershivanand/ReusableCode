import React, { createContext, useContext, useMemo } from "react";
import { AIClient, type AIClientOptions } from "./ai-client.js";

const AIContext = createContext<AIClient | null>(null);

export interface AIProviderProps extends AIClientOptions {
  client?: AIClient;
  children: React.ReactNode;
}

export const AIContextProvider: React.FC<AIProviderProps> = ({
  client,
  baseUrl,
  getAuthToken,
  getTenantId,
  children
}) => {
  const aiClient = useMemo(() => {
    if (client) return client;
    return new AIClient({ baseUrl, getAuthToken, getTenantId });
  }, [client, baseUrl, getAuthToken, getTenantId]);

  return <AIContext.Provider value={aiClient}>{children}</AIContext.Provider>;
};

export function useAIContext(): AIClient {
  const ctx = useContext(AIContext);
  if (!ctx) {
    throw new Error("useAIContext must be used within an AIContextProvider");
  }
  return ctx;
}
