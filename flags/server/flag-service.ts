import type { IFeatureFlagRepository } from "./repository.js";
import { MemoryFlagAdapter } from "../providers/memory-adapter.js";
import type { IFeatureFlagProvider } from "../providers/flag-provider.js";
import {
  type FeatureFlag,
  type EvaluationContext,
  type EvaluationResult,
  FeatureFlagSchema,
  EvaluationContextSchema
} from "../schemas/flag-schemas.js";

export class FeatureFlagService {
  private provider: IFeatureFlagProvider;

  constructor(
    private readonly repository: IFeatureFlagRepository,
    provider?: IFeatureFlagProvider
  ) {
    this.provider = provider || new MemoryFlagAdapter();
  }

  async hasFeature(
    key: string,
    context: EvaluationContext = { environment: "production", attributes: {} },
    defaultValue: boolean = false
  ): Promise<boolean> {
    const res = await this.evaluateFlag(key, context, defaultValue);
    return res.enabled;
  }

  async evaluateFlag(
    key: string,
    context: EvaluationContext = { environment: "production", attributes: {} },
    defaultValue: boolean = false
  ): Promise<EvaluationResult> {
    const validatedContext = EvaluationContextSchema.parse(context);

    try {
      // First check local repository
      let flag = await this.repository.getFlag(key);
      if (!flag) {
        // Delegate to provider if not in local repository
        return await this.provider.evaluate(key, validatedContext, defaultValue);
      }

      // Kill switch check: fail closed
      if (flag.isKillSwitch && !flag.enabled) {
        return {
          key,
          enabled: false,
          reason: "KILL_SWITCH_ACTIVE"
        };
      }

      // Expiry check
      if (flag.expiresAt && new Date() > new Date(flag.expiresAt)) {
        return {
          key,
          enabled: false,
          reason: "FLAG_EXPIRED"
        };
      }

      // Lifecycle state
      if (flag.lifecycleState === "EXPIRED" || flag.lifecycleState === "DRAFT") {
        return {
          key,
          enabled: false,
          reason: `FLAG_LIFECYCLE_${flag.lifecycleState}`
        };
      }

      // Evaluate via memory adapter logic with all repository flags for dependency resolution
      const allFlags = await this.repository.listFlags();
      const adapter = new MemoryFlagAdapter(allFlags);
      return await adapter.evaluate(key, validatedContext, defaultValue);
    } catch {
      // Safe default on error
      return {
        key,
        enabled: defaultValue,
        reason: "EVALUATION_ERROR_SAFE_DEFAULT",
        isDefault: true
      };
    }
  }

  async createFlag(input: unknown, actor: string): Promise<FeatureFlag> {
    const validated = FeatureFlagSchema.parse(input);
    const existing = await this.repository.getFlag(validated.key);
    if (existing) {
      throw new Error(`Feature flag '${validated.key}' already exists`);
    }

    const saved = await this.repository.saveFlag(validated);
    await this.repository.saveAuditEntry({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      flagKey: saved.key,
      action: "CREATE",
      actor,
      newState: saved,
      timestamp: new Date()
    });
    return saved;
  }

  async updateFlag(key: string, updates: Partial<FeatureFlag>, actor: string): Promise<FeatureFlag> {
    const existing = await this.repository.getFlag(key);
    if (!existing) {
      throw new Error(`Feature flag '${key}' not found`);
    }

    const updated = FeatureFlagSchema.parse({
      ...existing,
      ...updates,
      key, // prevent key change
      updatedAt: new Date()
    });

    const saved = await this.repository.saveFlag(updated);
    await this.repository.saveAuditEntry({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      flagKey: key,
      action: "UPDATE",
      actor,
      previousState: existing,
      newState: saved,
      timestamp: new Date()
    });
    return saved;
  }

  async toggleFlag(key: string, enabled: boolean, actor: string): Promise<FeatureFlag> {
    const existing = await this.repository.getFlag(key);
    if (!existing) throw new Error(`Feature flag '${key}' not found`);

    existing.enabled = enabled;
    const saved = await this.repository.saveFlag(existing);
    await this.repository.saveAuditEntry({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      flagKey: key,
      action: "TOGGLE",
      actor,
      previousState: { enabled: !enabled },
      newState: { enabled },
      timestamp: new Date()
    });
    return saved;
  }

  async setRollout(key: string, percentage: number, actor: string): Promise<FeatureFlag> {
    if (percentage < 0 || percentage > 100) {
      throw new Error("Percentage must be between 0 and 100");
    }
    const existing = await this.repository.getFlag(key);
    if (!existing) throw new Error(`Feature flag '${key}' not found`);

    const prevRollout = existing.percentageRollout;
    existing.percentageRollout = percentage;
    const saved = await this.repository.saveFlag(existing);
    await this.repository.saveAuditEntry({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      flagKey: key,
      action: "ROLLOUT_CHANGE",
      actor,
      previousState: { percentageRollout: prevRollout },
      newState: { percentageRollout: percentage },
      timestamp: new Date()
    });
    return saved;
  }

  async deleteFlag(key: string, actor: string): Promise<void> {
    const existing = await this.repository.getFlag(key);
    if (!existing) throw new Error(`Feature flag '${key}' not found`);

    await this.repository.deleteFlag(key);
    await this.repository.saveAuditEntry({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      flagKey: key,
      action: "DELETE",
      actor,
      previousState: existing,
      timestamp: new Date()
    });
  }

  async listFlags(): Promise<FeatureFlag[]> {
    return this.repository.listFlags();
  }

  async getAuditLog(flagKey?: string) {
    return this.repository.listAuditEntries(flagKey);
  }
}
