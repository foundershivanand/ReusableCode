import { createHash } from "node:crypto";
import type { IFeatureFlagProvider } from "./flag-provider.js";
import type {
  FeatureFlag,
  EvaluationContext,
  EvaluationResult,
  FlagTargetingRule
} from "../schemas/flag-schemas.js";

export class MemoryFlagAdapter implements IFeatureFlagProvider {
  public name = "MEMORY";
  private flags: Map<string, FeatureFlag> = new Map();

  constructor(initialFlags: FeatureFlag[] = []) {
    initialFlags.forEach((f) => this.flags.set(f.key, f));
  }

  async getFlag(key: string): Promise<FeatureFlag | null> {
    const flag = this.flags.get(key);
    return flag ? JSON.parse(JSON.stringify(flag)) : null;
  }

  async listFlags(): Promise<FeatureFlag[]> {
    return Array.from(this.flags.values()).map((f) => JSON.parse(JSON.stringify(f)));
  }

  async saveFlag(flag: FeatureFlag): Promise<FeatureFlag> {
    const updated = { ...flag, updatedAt: new Date() };
    this.flags.set(flag.key, updated);
    return JSON.parse(JSON.stringify(updated));
  }

  async deleteFlag(key: string): Promise<void> {
    this.flags.delete(key);
  }

  async evaluate(
    key: string,
    context: EvaluationContext,
    defaultVal: boolean = false
  ): Promise<EvaluationResult> {
    const flag = this.flags.get(key);
    if (!flag) {
      return {
        key,
        enabled: defaultVal,
        reason: "FLAG_NOT_FOUND",
        isDefault: true
      };
    }

    // Kill switch check
    if (flag.isKillSwitch && !flag.enabled) {
      return {
        key,
        enabled: false,
        reason: "KILL_SWITCH_ACTIVE"
      };
    }

    // Flag expiration check
    if (flag.expiresAt && new Date() > new Date(flag.expiresAt)) {
      return {
        key,
        enabled: false,
        reason: "FLAG_EXPIRED"
      };
    }

    // Lifecycle state check
    if (flag.lifecycleState === "EXPIRED" || flag.lifecycleState === "DRAFT") {
      return {
        key,
        enabled: false,
        reason: `FLAG_LIFECYCLE_${flag.lifecycleState}`
      };
    }

    // If flag is globally disabled
    if (!flag.enabled) {
      return {
        key,
        enabled: false,
        reason: "FLAG_DISABLED"
      };
    }

    // Dependency check (e.g. Feature A requires Feature B)
    if (flag.dependencies.length > 0) {
      for (const depKey of flag.dependencies) {
        const depResult = await this.evaluate(depKey, context, false);
        if (!depResult.enabled) {
          return {
            key,
            enabled: false,
            reason: `DEPENDENCY_UNSATISFIED:${depKey}`
          };
        }
      }
    }

    // Targeting rules evaluation
    if (flag.targetingRules.length > 0) {
      const matchesRules = flag.targetingRules.every((rule) =>
        this.evaluateRule(rule, context)
      );
      if (!matchesRules) {
        return {
          key,
          enabled: false,
          reason: "TARGETING_RULES_MISMATCH"
        };
      }
    }

    // Percentage rollout with consistent hashing
    if (flag.percentageRollout < 100) {
      const distinctId =
        context.userId || context.organizationId || context.tenantId || "anonymous";
      const bucket = this.calculateBucket(`${key}:${distinctId}`);

      if (bucket >= flag.percentageRollout) {
        return {
          key,
          enabled: false,
          reason: `ROLLOUT_BUCKET_EXCLUDED:${bucket}`
        };
      }
    }

    return {
      key,
      enabled: true,
      reason: "MATCHED_ROLLOUT_OR_RULES",
      remoteConfig: flag.remoteConfigValue
    };
  }

  private evaluateRule(rule: FlagTargetingRule, context: EvaluationContext): boolean {
    let ctxValue: string | undefined;

    if (rule.attribute === "userId") ctxValue = context.userId;
    else if (rule.attribute === "tenantId") ctxValue = context.tenantId;
    else if (rule.attribute === "organizationId") ctxValue = context.organizationId;
    else if (rule.attribute === "role") ctxValue = context.role;
    else if (rule.attribute === "plan") ctxValue = context.plan;
    else if (rule.attribute === "environment") ctxValue = context.environment;
    else if (rule.attribute === "email") ctxValue = context.attributes?.email;

    if (!ctxValue) return false;

    switch (rule.operator) {
      case "EQUALS":
        return rule.values.includes(ctxValue);
      case "IN":
        return rule.values.includes(ctxValue);
      case "NOT_IN":
        return !rule.values.includes(ctxValue);
      case "CONTAINS":
        return rule.values.some((v) => ctxValue?.includes(v));
      default:
        return false;
    }
  }

  private calculateBucket(input: string): number {
    const hash = createHash("sha256").update(input).digest("hex");
    const intVal = parseInt(hash.substring(0, 8), 16);
    return intVal % 100;
  }
}
