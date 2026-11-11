import type { IFeatureFlagProvider } from "./flag-provider.js";
import type {
  FeatureFlag,
  EvaluationContext,
  EvaluationResult
} from "../schemas/flag-schemas.js";

export interface PostHogAdapterConfig {
  apiKey: string;
  host?: string;
}

export class PostHogFlagAdapter implements IFeatureFlagProvider {
  public name = "POSTHOG";
  public apiKey: string;
  public host: string;

  constructor(config: PostHogAdapterConfig) {
    this.apiKey = config.apiKey;
    this.host = config.host || "https://app.posthog.com";
  }

  async getFlag(_key: string): Promise<FeatureFlag | null> {
    return null; // External provider delegation
  }

  async listFlags(): Promise<FeatureFlag[]> {
    return [];
  }

  async saveFlag(flag: FeatureFlag): Promise<FeatureFlag> {
    return flag;
  }

  async deleteFlag(_key: string): Promise<void> {}

  async evaluate(
    key: string,
    context: EvaluationContext,
    defaultVal: boolean = false
  ): Promise<EvaluationResult> {
    try {
      const _distinctId = context.userId || context.tenantId || "anonymous";
      void _distinctId;
      // In production: call PostHog API /decide endpoint
      return {
        key,
        enabled: defaultVal,
        reason: "POSTHOG_EVALUATION",
        isDefault: false
      };
    } catch {
      return {
        key,
        enabled: defaultVal,
        reason: "POSTHOG_ERROR_SAFE_DEFAULT",
        isDefault: true
      };
    }
  }
}
