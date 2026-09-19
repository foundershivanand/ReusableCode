import React, { createContext, useContext, useState } from "react";
import { SeoClient } from "./seo-client.js";
import type { PageMetadataInput, ResolvedMetadata } from "../schemas/seo-schemas.js";

interface SeoContextValue {
  client: SeoClient;
  currentMetadata: ResolvedMetadata | null;
  setMetadata: (meta: ResolvedMetadata) => void;
  resolveMetadata: (input: PageMetadataInput) => Promise<ResolvedMetadata>;
}

const SeoContext = createContext<SeoContextValue | null>(null);

export interface SeoProviderProps {
  client?: SeoClient;
  initialMetadata?: ResolvedMetadata;
  children: React.ReactNode;
}

export const SeoProvider: React.FC<SeoProviderProps> = ({
  client = new SeoClient(),
  initialMetadata = null,
  children
}) => {
  const [currentMetadata, setCurrentMetadata] = useState<ResolvedMetadata | null>(initialMetadata);

  const resolveMetadata = async (input: PageMetadataInput) => {
    const resolved = await client.resolveMetadata(input);
    setCurrentMetadata(resolved);
    return resolved;
  };

  return (
    <SeoContext.Provider
      value={{
        client,
        currentMetadata,
        setMetadata: setCurrentMetadata,
        resolveMetadata
      }}
    >
      {children}
    </SeoContext.Provider>
  );
};

export const useSeo = (): SeoContextValue => {
  const ctx = useContext(SeoContext);
  if (!ctx) {
    throw new Error("useSeo must be used within a SeoProvider");
  }
  return ctx;
};
