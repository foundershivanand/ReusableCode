import {
  SystemHealthReport,
  Incident,
  SloDefinition,
  Postmortem,
  IncidentState,
} from "../schemas/monitoring-schemas.js";

export class MonitoringClient {
  constructor(
    private baseUrl: string = "/api/monitoring",
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
      throw new Error(errorData.message || `Monitoring API error: ${res.status}`);
    }

    return res.json();
  }

  async getHealth(isPublic: boolean = true): Promise<SystemHealthReport> {
    return this.request<SystemHealthReport>(`/health?public=${isPublic}`);
  }

  async getIncidents(state?: string): Promise<Incident[]> {
    const q = state ? `?state=${encodeURIComponent(state)}` : "";
    return this.request<Incident[]>(`/incidents${q}`);
  }

  async getIncident(id: string): Promise<Incident> {
    return this.request<Incident>(`/incidents/${encodeURIComponent(id)}`);
  }

  async updateIncident(params: {
    id: string;
    state: IncidentState;
    message: string;
    author: string;
    publicMessage?: string;
  }): Promise<Incident> {
    return this.request<Incident>(`/incidents/${encodeURIComponent(params.id)}/state`, {
      method: "PUT",
      body: JSON.stringify(params),
    });
  }

  async attachPostmortem(id: string, postmortem: Postmortem): Promise<Incident> {
    return this.request<Incident>(`/incidents/${encodeURIComponent(id)}/postmortem`, {
      method: "POST",
      body: JSON.stringify(postmortem),
    });
  }

  async getSlos(): Promise<SloDefinition[]> {
    return this.request<SloDefinition[]>("/slos");
  }
}
