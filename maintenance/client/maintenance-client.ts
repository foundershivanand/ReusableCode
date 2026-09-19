import {
  MaintenanceConfig,
  SystemBanner,
  CheckMaintenanceInput,
  CheckMaintenanceResult,
} from "../schemas/maintenance-schemas.js";

export class MaintenanceClient {
  constructor(
    private baseUrl: string = "/api/maintenance",
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
      throw new Error(errorData.message || `Maintenance API error: ${res.status}`);
    }

    return res.json();
  }

  async checkStatus(input: CheckMaintenanceInput): Promise<CheckMaintenanceResult> {
    return this.request<CheckMaintenanceResult>("/check", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async getBanners(scope: string = "ALL"): Promise<SystemBanner[]> {
    return this.request<SystemBanner[]>(`/banners?scope=${encodeURIComponent(scope)}`);
  }

  async setMaintenance(config: MaintenanceConfig): Promise<MaintenanceConfig> {
    return this.request<MaintenanceConfig>("/config", {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  async clearMaintenance(id: string): Promise<void> {
    return this.request<void>(`/config/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }
}
