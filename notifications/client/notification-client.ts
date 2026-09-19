import type {
  NotificationRecord,
  NotificationPreferences,
  NotificationPayload
} from "../schemas/index.js";

export interface NotificationClientOptions {
  baseUrl?: string;
  getAuthToken?: () => Promise<string | null> | string | null;
}

export class NotificationClient {
  private baseUrl: string;
  private getAuthToken?: () => Promise<string | null> | string | null;

  constructor(options: NotificationClientOptions = {}) {
    this.baseUrl = options.baseUrl || "/api/notifications";
    this.getAuthToken = options.getAuthToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set("Content-Type", "application/json");

    if (this.getAuthToken) {
      const token = await this.getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Notification API Error: ${res.status}`);
    }

    return res.json();
  }

  async listInApp(unreadOnly = false): Promise<NotificationRecord[]> {
    return this.request<NotificationRecord[]>(`/in-app?unreadOnly=${unreadOnly}`);
  }

  async markAsRead(id: string): Promise<void> {
    await this.request(`/in-app/${id}/read`, { method: "POST" });
  }

  async markAllAsRead(): Promise<void> {
    await this.request("/in-app/read-all", { method: "POST" });
  }

  async getPreferences(): Promise<NotificationPreferences> {
    return this.request<NotificationPreferences>("/preferences");
  }

  async updatePreferences(prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    return this.request<NotificationPreferences>("/preferences", {
      method: "PATCH",
      body: JSON.stringify(prefs)
    });
  }

  async send(payload: NotificationPayload): Promise<NotificationRecord> {
    return this.request<NotificationRecord>("/send", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
}
