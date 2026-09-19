import {
  MaintenanceConfig,
  SystemBanner,
} from "../schemas/maintenance-schemas.js";

export interface MaintenanceRepository {
  getActiveConfigs(): Promise<MaintenanceConfig[]>;
  getConfigById(id: string): Promise<MaintenanceConfig | null>;
  saveConfig(config: MaintenanceConfig): Promise<void>;
  deleteConfig(id: string): Promise<void>;
  getActiveBanners(): Promise<SystemBanner[]>;
  getBannerById(id: string): Promise<SystemBanner | null>;
  saveBanner(banner: SystemBanner): Promise<void>;
  deleteBanner(id: string): Promise<void>;
}

export class InMemoryMaintenanceRepository implements MaintenanceRepository {
  private configs = new Map<string, MaintenanceConfig>();
  private banners = new Map<string, SystemBanner>();

  async getActiveConfigs(): Promise<MaintenanceConfig[]> {
    const now = new Date();
    return Array.from(this.configs.values()).filter((c) => {
      if (c.mode === "OFF") return false;
      const start = new Date(c.startsAt);
      if (now < start) return false;
      if (c.endsAt && now > new Date(c.endsAt)) return false;
      return true;
    });
  }

  async getConfigById(id: string): Promise<MaintenanceConfig | null> {
    const c = this.configs.get(id);
    return c ? { ...c } : null;
  }

  async saveConfig(config: MaintenanceConfig): Promise<void> {
    this.configs.set(config.id, { ...config });
  }

  async deleteConfig(id: string): Promise<void> {
    this.configs.delete(id);
  }

  async getActiveBanners(): Promise<SystemBanner[]> {
    const now = new Date();
    return Array.from(this.banners.values()).filter((b) => {
      if (!b.isActive) return false;
      const start = new Date(b.startsAt);
      if (now < start) return false;
      if (b.endsAt && now > new Date(b.endsAt)) return false;
      return true;
    });
  }

  async getBannerById(id: string): Promise<SystemBanner | null> {
    const b = this.banners.get(id);
    return b ? { ...b } : null;
  }

  async saveBanner(banner: SystemBanner): Promise<void> {
    this.banners.set(banner.id, { ...banner });
  }

  async deleteBanner(id: string): Promise<void> {
    this.banners.delete(id);
  }
}
