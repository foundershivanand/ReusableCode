import type { IFeatureFlagProvider } from "./flag-provider.js";
import type {
  FeatureFlag,
  EvaluationContext,
  EvaluationResult
} from "../schemas/flag-schemas.js";

export interface LaunchDarklyAdapterConfig {
  sdkKey: string;
}

export class LaunchDarklyFlagAdapter implements IFeatureFlagProvider {
  public name = "LAUNCHDARKLY";
  public sdkKey: string;

  constructor(config: LaunchDarklyAdapterConfig) {
    this.sdkKey = config.sdkKey;
  }

  async getFlag(_key: string): Promise<FeatureFlag | null> {
    return null;
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
    _context: EvaluationContext,
    defaultVal: boolean = false
  ): Promise<EvaluationResult> {
    return {
      key,
      enabled: defaultVal,
      reason: "LAUNCHDARKLY_EVALUATION",
      isDefault: false
    };
  }
}
