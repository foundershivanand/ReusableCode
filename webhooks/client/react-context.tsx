import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { WebhooksClient } from "./webhooks-client.js";
import type {
  ApiKey,
  CreateApiKeyInput,
  WebhookEndpoint,
  WebhookDeliveryLog
} from "../schemas/webhook-schemas.js";

interface WebhooksContextValue {
  client: WebhooksClient;
  apiKeys: ApiKey[];
  endpoints: WebhookEndpoint[];
  deliveryLogs: WebhookDeliveryLog[];
  isLoading: boolean;
  error: string | null;
  createApiKey: (input: Omit<CreateApiKeyInput, "tenantId" | "userId">) => Promise<{ apiKey: ApiKey; rawKey: string }>;
  revokeApiKey: (keyId: string) => Promise<void>;
  registerEndpoint: (url: string, eventTypes: string[], description?: string) => Promise<WebhookEndpoint>;
  refresh: () => Promise<void>;
}

const WebhooksContext = createContext<WebhooksContextValue | null>(null);

export interface WebhooksProviderProps {
  client?: WebhooksClient;
  tenantId: string;
  userId: string;
  children: React.ReactNode;
}

export const WebhooksProvider: React.FC<WebhooksProviderProps> = ({
  client = new WebhooksClient(),
  tenantId,
  userId,
  children
}) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<WebhookDeliveryLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [keys, eps, logs] = await Promise.all([
        client.listApiKeys(),
        client.listEndpoints(),
        client.listDeliveryLogs()
      ]);
      setApiKeys(keys);
      setEndpoints(eps);
      setDeliveryLogs(logs);
    } catch (err: any) {
      setError(err.message || "Failed to load webhook data");
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createApiKey = async (input: Omit<CreateApiKeyInput, "tenantId" | "userId">) => {
    const result = await client.createApiKey({ ...input, tenantId, userId });
    setApiKeys((prev) => [result.apiKey, ...prev]);
    return result;
  };

  const revokeApiKey = async (keyId: string) => {
    await client.revokeApiKey(keyId);
    setApiKeys((prev) =>
      prev.map((k) => (k.id === keyId ? { ...k, lifecycleState: "REVOKED" } : k))
    );
  };

  const registerEndpoint = async (url: string, eventTypes: string[], description?: string) => {
    const ep = await client.registerEndpoint({ url, eventTypes, description });
    setEndpoints((prev) => [ep, ...prev]);
    return ep;
  };

  return (
    <WebhooksContext.Provider
      value={{
        client,
        apiKeys,
        endpoints,
        deliveryLogs,
        isLoading,
        error,
        createApiKey,
        revokeApiKey,
        registerEndpoint,
        refresh
      }}
    >
      {children}
    </WebhooksContext.Provider>
  );
};

export const useWebhooks = (): WebhooksContextValue => {
  const ctx = useContext(WebhooksContext);
  if (!ctx) {
    throw new Error("useWebhooks must be used within a WebhooksProvider");
  }
  return ctx;
};
