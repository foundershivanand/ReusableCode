import type {
  ApiKey,
  WebhookEndpoint,
  WebhookDeliveryLog
} from "../schemas/webhook-schemas.js";

export interface IWebhookRepository {
  // API Keys
  saveApiKey(key: ApiKey): Promise<ApiKey>;
  getApiKeyById(id: string): Promise<ApiKey | null>;
  getApiKeyByPrefix(prefix: string): Promise<ApiKey | null>;
  listApiKeys(tenantId: string): Promise<ApiKey[]>;
  deleteApiKey(id: string): Promise<void>;

  // Webhook Endpoints
  saveEndpoint(endpoint: WebhookEndpoint): Promise<WebhookEndpoint>;
  getEndpointById(id: string): Promise<WebhookEndpoint | null>;
  listEndpoints(tenantId: string): Promise<WebhookEndpoint[]>;
  deleteEndpoint(id: string): Promise<void>;

  // Delivery Logs
  saveDeliveryLog(log: WebhookDeliveryLog): Promise<WebhookDeliveryLog>;
  getDeliveryLogById(id: string): Promise<WebhookDeliveryLog | null>;
  listDeliveryLogs(endpointId?: string, tenantId?: string): Promise<WebhookDeliveryLog[]>;
}

export class InMemoryWebhookRepository implements IWebhookRepository {
  private apiKeys: Map<string, ApiKey> = new Map();
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  private deliveryLogs: WebhookDeliveryLog[] = [];

  // API Keys
  async saveApiKey(key: ApiKey): Promise<ApiKey> {
    this.apiKeys.set(key.id, JSON.parse(JSON.stringify(key)));
    return key;
  }

  async getApiKeyById(id: string): Promise<ApiKey | null> {
    const k = this.apiKeys.get(id);
    return k ? JSON.parse(JSON.stringify(k)) : null;
  }

  async getApiKeyByPrefix(prefix: string): Promise<ApiKey | null> {
    for (const k of this.apiKeys.values()) {
      if (k.prefix === prefix) {
        return JSON.parse(JSON.stringify(k));
      }
    }
    return null;
  }

  async listApiKeys(tenantId: string): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values())
      .filter((k) => k.tenantId === tenantId)
      .map((k) => JSON.parse(JSON.stringify(k)));
  }

  async deleteApiKey(id: string): Promise<void> {
    this.apiKeys.delete(id);
  }

  // Webhook Endpoints
  async saveEndpoint(endpoint: WebhookEndpoint): Promise<WebhookEndpoint> {
    this.endpoints.set(endpoint.id, JSON.parse(JSON.stringify(endpoint)));
    return endpoint;
  }

  async getEndpointById(id: string): Promise<WebhookEndpoint | null> {
    const e = this.endpoints.get(id);
    return e ? JSON.parse(JSON.stringify(e)) : null;
  }

  async listEndpoints(tenantId: string): Promise<WebhookEndpoint[]> {
    return Array.from(this.endpoints.values())
      .filter((e) => e.tenantId === tenantId)
      .map((e) => JSON.parse(JSON.stringify(e)));
  }

  async deleteEndpoint(id: string): Promise<void> {
    this.endpoints.delete(id);
  }

  // Delivery Logs
  async saveDeliveryLog(log: WebhookDeliveryLog): Promise<WebhookDeliveryLog> {
    this.deliveryLogs.push(JSON.parse(JSON.stringify(log)));
    return log;
  }

  async getDeliveryLogById(id: string): Promise<WebhookDeliveryLog | null> {
    const l = this.deliveryLogs.find((log) => log.id === id);
    return l ? JSON.parse(JSON.stringify(l)) : null;
  }

  async listDeliveryLogs(endpointId?: string, tenantId?: string): Promise<WebhookDeliveryLog[]> {
    let logs = [...this.deliveryLogs];
    if (endpointId) logs = logs.filter((l) => l.endpointId === endpointId);
    if (tenantId) logs = logs.filter((l) => l.tenantId === tenantId);
    return logs.reverse();
  }
}
