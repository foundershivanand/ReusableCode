import {
  DeploymentMetadata,
  SanitizedConfigItem,
  ConfigDriftFinding,
} from "../schemas/deployment-schemas.js";

export class DeploymentClient {
  constructor(
    private baseUrl: string = "/api/deployment",
    private headers: Record<string, string> = {}
  ) {}

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(errorData.message || `Deployment API error: ${res.status}`);
    }

    return res.json();
  }

  async getMetadata(): Promise<DeploymentMetadata> {
    return this.request<DeploymentMetadata>("/metadata");
  }

  async getSanitizedConfig(): Promise<SanitizedConfigItem[]> {
    return this.request<SanitizedConfigItem[]>("/config");
  }

  async getDriftAudit(): Promise<ConfigDriftFinding[]> {
    return this.request<ConfigDriftFinding[]>("/drift");
  }
}
