import { useMonitoringContext } from "./react-context.js";

export function useSystemHealth() {
  const { health, loading, refreshHealth } = useMonitoringContext();
  return { health, loading, refreshHealth };
}

export function useIncidents() {
  const { incidents, loading, refreshIncidents } = useMonitoringContext();
  return { incidents, loading, refreshIncidents };
}

export function useSlos() {
  const { slos } = useMonitoringContext();
  return { slos };
}
