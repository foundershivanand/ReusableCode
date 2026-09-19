import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { CustomDomain, TenantBranding, UpdateBrandingInput } from "../schemas/domain-schemas.js";
import { DomainClient } from "./domain-client.js";

export interface DomainsContextValue {
  domains: CustomDomain[];
  branding: TenantBranding | null;
  loading: boolean;
  requestDomain: (domain: string) => Promise<CustomDomain>;
  verifyDomain: (domainId: string) => Promise<CustomDomain>;
  deleteDomain: (domainId: string) => Promise<void>;
  updateBranding: (input: Omit<UpdateBrandingInput, "tenantId">) => Promise<TenantBranding>;
  refresh: () => Promise<void>;
}

const DomainsContext = createContext<DomainsContextValue | null>(null);

export interface DomainsProviderProps {
  client?: DomainClient;
  tenantId: string;
  children: React.ReactNode;
}

export const DomainsProvider: React.FC<DomainsProviderProps> = ({
  client,
  tenantId,
  children,
}) => {
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const domainClient = useMemo(() => client || new DomainClient(), [client]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [domainList, brandingData] = await Promise.all([
        domainClient.getDomains(tenantId),
        domainClient.getBranding(tenantId),
      ]);
      setDomains(domainList);
      setBranding(brandingData);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [domainClient, tenantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestDomain = useCallback(
    async (domain: string) => {
      const created = await domainClient.requestDomain({ tenantId, domain });
      setDomains((prev) => [...prev, created]);
      return created;
    },
    [domainClient, tenantId]
  );

  const verifyDomain = useCallback(
    async (domainId: string) => {
      const verified = await domainClient.verifyDomain(domainId, tenantId);
      setDomains((prev) => prev.map((d) => (d.id === domainId ? verified : d)));
      return verified;
    },
    [domainClient, tenantId]
  );

  const deleteDomain = useCallback(
    async (domainId: string) => {
      await domainClient.deleteDomain(domainId, tenantId);
      setDomains((prev) => prev.filter((d) => d.id !== domainId));
    },
    [domainClient, tenantId]
  );

  const updateBranding = useCallback(
    async (input: Omit<UpdateBrandingInput, "tenantId">) => {
      const updated = await domainClient.updateBranding({ ...input, tenantId });
      setBranding(updated);
      return updated;
    },
    [domainClient, tenantId]
  );

  return (
    <DomainsContext.Provider
      value={{
        domains,
        branding,
        loading,
        requestDomain,
        verifyDomain,
        deleteDomain,
        updateBranding,
        refresh,
      }}
    >
      {children}
    </DomainsContext.Provider>
  );
};

export function useDomainsContext(): DomainsContextValue {
  const ctx = useContext(DomainsContext);
  if (!ctx) {
    throw new Error("useDomainsContext must be used within a DomainsProvider");
  }
  return ctx;
}
