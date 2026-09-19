import type {
  UserSettings,
  ResolvedPreferences,
  ProfileSettings,
  AppearanceSettings,
  LanguageSettings,
  PrivacyPreferences
} from "../schemas/index.js";

export interface SettingsClientOptions {
  baseUrl?: string;
  getAuthToken?: () => Promise<string | null> | string | null;
}

export class SettingsClient {
  private baseUrl: string;
  private getAuthToken?: () => Promise<string | null> | string | null;

  constructor(options: SettingsClientOptions = {}) {
    this.baseUrl = options.baseUrl || "/api/settings";
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
      throw new Error(err.message || `Settings API Error: ${res.status}`);
    }

    return res.json();
  }

  async getSettings(): Promise<UserSettings> {
    return this.request<UserSettings>("/");
  }

  async getResolvedPreferences(): Promise<ResolvedPreferences> {
    return this.request<ResolvedPreferences>("/resolved");
  }

  async updateProfile(profile: Partial<ProfileSettings>): Promise<UserSettings> {
    return this.request<UserSettings>("/profile", {
      method: "PATCH",
      body: JSON.stringify(profile)
    });
  }

  async updateAppearance(appearance: Partial<AppearanceSettings>): Promise<UserSettings> {
    return this.request<UserSettings>("/appearance", {
      method: "PATCH",
      body: JSON.stringify(appearance)
    });
  }

  async updateLanguage(language: Partial<LanguageSettings>): Promise<UserSettings> {
    return this.request<UserSettings>("/language", {
      method: "PATCH",
      body: JSON.stringify(language)
    });
  }

  async updatePrivacy(privacy: Partial<PrivacyPreferences>): Promise<UserSettings> {
    return this.request<UserSettings>("/privacy", {
      method: "PATCH",
      body: JSON.stringify(privacy)
    });
  }

  async exportData(): Promise<any> {
    return this.request<any>("/export");
  }

  async importData(data: any): Promise<UserSettings> {
    return this.request<UserSettings>("/import", {
      method: "POST",
      body: JSON.stringify(data)
    });
  }
}
