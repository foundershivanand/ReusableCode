import { useFeatureFlags } from "./react-context.js";

export { useFeatureFlags };

export function useFeatureFlag(key: string, defaultValue: boolean = false): boolean {
  const { hasFeature } = useFeatureFlags();
  return hasFeature(key, defaultValue);
}

export function useRemoteConfig<T = Record<string, any>>(key: string): T | undefined {
  const { getFlagConfig } = useFeatureFlags();
  return getFlagConfig(key) as T | undefined;
}
