import type {
  ApiKey,
  CreateApiKeyInput,
  WebhookEndpoint,
  WebhookDeliveryLog
} from "../schemas/webhook-schemas.js";

export interface WebhooksClientConfig {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  headers?: Record<string, string>;
}

export class WebhooksClient {
  private baseUrl: string;
  private fetchFn: typeof fetch;
  private headers: Record<string, string>;

  constructor(config: WebhooksClientConfig = {}) {
    this.baseUrl = config.baseUrl || "/api/webhooks";
    this.fetchFn = config.fetchFn || (typeof fetch !== "undefined" ? fetch : (() => {}) as any);
    this.headers = config.headers || { "Content-Type": "application/json" };
  }

  // API Keys
  async createApiKey(input: CreateApiKeyInput): Promise<{ apiKey: ApiKey; rawKey: string }> {
    const res = await this.fetchFn(`${this.baseUrl}/api-keys`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error(`Failed to create API key: ${res.statusText}`);
    return res.json();
  }

  async listApiKeys(): Promise<ApiKey[]> {
    const res = await this.fetchFn(`${this.baseUrl}/api-keys`, {
      method: "GET",
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to list API keys: ${res.statusText}`);
    return res.json();
  }

  async revokeApiKey(keyId: string): Promise<void> {
    const res = await this.fetchFn(`${this.baseUrl}/api-keys/${keyId}`, {
      method: "DELETE",
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to revoke API key: ${res.statusText}`);
  }

  // Webhook Endpoints
  async registerEndpoint(input: {
    url: string;
    eventTypes: string[];
    description?: string;
  }): Promise<WebhookEndpoint> {
    const res = await this.fetchFn(`${this.baseUrl}/endpoints`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(input)
    });
    if (!res.ok) throw new Error(`Failed to register webhook endpoint: ${res.statusText}`);
    return res.json();
  }

  async listEndpoints(): Promise<WebhookEndpoint[]> {
    const res = await this.fetchFn(`${this.baseUrl}/endpoints`, {
      method: "GET",
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to list endpoints: ${res.statusText}`);
    return res.json();
  }

  async listDeliveryLogs(endpointId?: string): Promise<WebhookDeliveryLog[]> {
    const url = endpointId
      ? `${this.baseUrl}/endpoints/${endpointId}/logs`
      : `${this.baseUrl}/logs`;
    const res = await this.fetchFn(url, {
      method: "GET",
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Failed to list delivery logs: ${res.statusText}`);
    return res.json();
  }
}
