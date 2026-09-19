import type { UserSettings, OrganizationSettings } from "../schemas/index.js";

export interface SettingsRepository {
  getUserSettings(userId: string): Promise<UserSettings | null>;
  saveUserSettings(settings: UserSettings): Promise<UserSettings>;
  getOrganizationSettings(orgId: string): Promise<OrganizationSettings | null>;
  saveOrganizationSettings(settings: OrganizationSettings): Promise<OrganizationSettings>;
  getRawSettings(userId: string): Promise<{ version: number; data: any } | null>;
  saveRawSettings(userId: string, version: number, data: any): Promise<void>;
}

export class InMemorySettingsRepository implements SettingsRepository {
  private userSettings: Map<string, UserSettings> = new Map();
  private orgSettings: Map<string, OrganizationSettings> = new Map();
  private rawStore: Map<string, { version: number; data: any }> = new Map();

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const s = this.userSettings.get(userId);
    return s ? { ...s } : null;
  }

  async saveUserSettings(settings: UserSettings): Promise<UserSettings> {
    this.userSettings.set(settings.userId, { ...settings });
    this.rawStore.set(settings.userId, { version: settings.schemaVersion, data: settings });
    return { ...settings };
  }

  async getOrganizationSettings(orgId: string): Promise<OrganizationSettings | null> {
    const s = this.orgSettings.get(orgId);
    return s ? { ...s } : null;
  }

  async saveOrganizationSettings(settings: OrganizationSettings): Promise<OrganizationSettings> {
    this.orgSettings.set(settings.organizationId, { ...settings });
    return { ...settings };
  }

  async getRawSettings(userId: string): Promise<{ version: number; data: any } | null> {
    const r = this.rawStore.get(userId);
    return r ? { ...r } : null;
  }

  async saveRawSettings(userId: string, version: number, data: any): Promise<void> {
    this.rawStore.set(userId, { version, data });
  }
}
