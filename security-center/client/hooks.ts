import { useSecurityCenterContext } from "./react-context.js";

export function useSecurityFindings() {
  const { findings, loading, updateFindingState, suppressFinding, refresh } = useSecurityCenterContext();
  return { findings, loading, updateFindingState, suppressFinding, refresh };
}

export function useSecurityScore() {
  const { score, loading, refresh } = useSecurityCenterContext();
  return { score, loading, refresh };
}

export function useSecurityEvents() {
  const { events, loading, refresh } = useSecurityCenterContext();
  return { events, loading, refresh };
}
