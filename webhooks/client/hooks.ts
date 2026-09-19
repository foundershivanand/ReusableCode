import { useWebhooks } from "./react-context.js";

export { useWebhooks };

export function useApiKeys() {
  const { apiKeys, createApiKey, revokeApiKey, isLoading, error } = useWebhooks();
  return { apiKeys, createApiKey, revokeApiKey, isLoading, error };
}

export function useWebhookEndpoints() {
  const { endpoints, registerEndpoint, deliveryLogs, isLoading, error } = useWebhooks();
  return { endpoints, registerEndpoint, deliveryLogs, isLoading, error };
}
