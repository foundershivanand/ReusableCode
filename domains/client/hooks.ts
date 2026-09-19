import { useDomainsContext } from "./react-context.js";

export function useDomains() {
  const { domains, loading, requestDomain, verifyDomain, deleteDomain, refresh } = useDomainsContext();
  return { domains, loading, requestDomain, verifyDomain, deleteDomain, refresh };
}

export function useBranding() {
  const { branding, updateBranding, refresh } = useDomainsContext();
  return { branding, updateBranding, refresh };
}
