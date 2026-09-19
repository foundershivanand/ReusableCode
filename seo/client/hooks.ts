import { useSeo } from "./react-context.js";

export { useSeo };

export function useCurrentMetadata() {
  const { currentMetadata } = useSeo();
  return currentMetadata;
}
