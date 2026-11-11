import { createHash, timingSafeEqual } from "node:crypto";
import {
  MaintenanceConfig,
  SystemBanner,
  CheckMaintenanceInput,
  ValidatedCheckMaintenanceInput,
  CheckMaintenanceInputSchema,
  CheckMaintenanceResult,
} from "../schemas/maintenance-schemas.js";
import { MaintenanceRepository } from "./repository.js";

export class MaintenanceService {
  constructor(private repository: MaintenanceRepository) {}

  private verifySecret(providedSecret: string, expectedHash: string): boolean {
    try {
      const providedHash = createHash("sha256").update(providedSecret).digest("hex");
      const a = Buffer.from(providedHash, "utf-8");
      const b = Buffer.from(expectedHash, "utf-8");
      if (a.length !== b.length) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  private isBypassed(config: MaintenanceConfig, input: ValidatedCheckMaintenanceInput): boolean {
    // 1. Role check
    if (
      input.userRoles &&
      input.userRoles.some((role) => config.allowedRoles.includes(role))
    ) {
      return true;
    }

    // 2. User ID check
    if (input.userId && config.allowedUserIds.includes(input.userId)) {
      return true;
    }

    // 3. IP check
    if (input.clientIp && config.allowedIps.includes(input.clientIp)) {
      return true;
    }

    // 4. Secret token check
    if (
      input.bypassSecret &&
      config.adminBypassSecretHash &&
      this.verifySecret(input.bypassSecret, config.adminBypassSecretHash)
    ) {
      return true;
    }

    return false;
  }

  private matchesScope(config: MaintenanceConfig, input: ValidatedCheckMaintenanceInput): boolean {
    switch (config.scope) {
      case "GLOBAL":
        return true;
      case "TENANT":
        return Boolean(input.tenantId && input.tenantId === config.target);
      case "ROUTE":
        if (config.target === "*") return true;
        return input.path.startsWith(config.target);
      case "API_VERSION":
        return input.path.startsWith(config.target);
      case "FEATURE":
        return true; // Used by feature gate checks
      default:
        return false;
    }
  }

  async checkMaintenance(input: CheckMaintenanceInput): Promise<CheckMaintenanceResult> {
    const validated = CheckMaintenanceInputSchema.parse(input);
    const activeConfigs = await this.repository.getActiveConfigs();

    for (const config of activeConfigs) {
      if (!this.matchesScope(config, validated)) {
        continue;
      }

      // Check if caller has authorized admin bypass
      if (this.isBypassed(config, validated)) {
        continue;
      }

      const now = Date.now();
      let retryAfterSeconds: number | undefined;
      if (config.endsAt) {
        const remainingMs = new Date(config.endsAt).getTime() - now;
        if (remainingMs > 0) {
          retryAfterSeconds = Math.ceil(remainingMs / 1000);
        }
      }

      if (config.mode === "FULL_MAINTENANCE") {
        return {
          blocked: true,
          readOnly: false,
          reason: `System is undergoing scheduled maintenance: ${config.title}`,
          publicMessage: config.message,
          retryAfterSeconds,
          statusCode: 503,
        };
      }

      if (config.mode === "READ_ONLY") {
        const isMutatingMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(
          validated.method.toUpperCase()
        );

        if (isMutatingMethod) {
          return {
            blocked: true,
            readOnly: true,
            reason: `System is in read-only mode: ${config.title}`,
            publicMessage: config.message,
            retryAfterSeconds,
            statusCode: 403,
          };
        }

        // Non-mutating method permitted, but flagged readOnly
        return {
          blocked: false,
          readOnly: true,
          reason: null,
          publicMessage: config.message,
          statusCode: 200,
        };
      }

      if (config.mode === "DEGRADED") {
        return {
          blocked: false,
          readOnly: false,
          reason: null,
          publicMessage: config.message,
          statusCode: 200,
        };
      }
    }

    return {
      blocked: false,
      readOnly: false,
      reason: null,
      publicMessage: null,
      statusCode: 200,
    };
  }

  async getActiveBanners(scope: "ALL" | "AUTHENTICATED" | "GUEST" = "ALL"): Promise<SystemBanner[]> {
    const banners = await this.repository.getActiveBanners();
    return banners.filter(
      (b) => b.targetScope === "ALL" || b.targetScope === scope
    );
  }

  async setMaintenanceConfig(config: MaintenanceConfig): Promise<MaintenanceConfig> {
    await this.repository.saveConfig(config);
    return config;
  }

  async removeMaintenanceConfig(id: string): Promise<void> {
    await this.repository.deleteConfig(id);
  }

  async addBanner(banner: SystemBanner): Promise<SystemBanner> {
    await this.repository.saveBanner(banner);
    return banner;
  }

  async removeBanner(id: string): Promise<void> {
    await this.repository.deleteBanner(id);
  }
}
