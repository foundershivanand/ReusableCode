import { useDeploymentContext } from "./react-context.js";

export function useDeploymentMetadata() {
  const { metadata, loading, refresh } = useDeploymentContext();
  return { metadata, loading, refresh };
}

export function useEnvironmentConfig() {
  const { configItems, driftFindings, loading, refresh } = useDeploymentContext();
  return { configItems, driftFindings, loading, refresh };
}
