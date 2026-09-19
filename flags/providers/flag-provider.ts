import type {
  FeatureFlag,
  EvaluationContext,
  EvaluationResult
} from "../schemas/flag-schemas.js";

export interface IFeatureFlagProvider {
  name: string;
  getFlag(key: string): Promise<FeatureFlag | null>;
  listFlags(): Promise<FeatureFlag[]>;
  evaluate(key: string, context: EvaluationContext, defaultVal?: boolean): Promise<EvaluationResult>;
  saveFlag(flag: FeatureFlag): Promise<FeatureFlag>;
  deleteFlag(key: string): Promise<void>;
}
