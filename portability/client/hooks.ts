import { usePortability } from "./react-context.js";

export { usePortability };

export function useDataExport() {
  const { triggerExport, activeExport, isLoading, error } = usePortability();
  return { triggerExport, activeExport, isLoading, error };
}

export function useDataImport() {
  const { triggerImport, activeImport, isLoading, error } = usePortability();
  return { triggerImport, activeImport, isLoading, error };
}
