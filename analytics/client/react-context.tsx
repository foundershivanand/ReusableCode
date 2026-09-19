import React, { createContext, useContext, useState } from "react";
import { AnalyticsClient } from "./analytics-client.js";

interface AnalyticsContextValue {
  client: AnalyticsClient;
  hasConsent: boolean;
  setConsent: (consent: boolean) => void;
  track: (eventVersion: string, eventName: string, properties?: Record<string, any>) => void;
}

const AnalyticsReactContext = createContext<AnalyticsContextValue | null>(null);

export interface AnalyticsProviderProps {
  client: AnalyticsClient;
  initialConsent?: boolean;
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  client,
  initialConsent = false,
  children
}) => {
  const [hasConsent, setConsent] = useState(initialConsent);

  const track = (eventVersion: string, eventName: string, properties: Record<string, any> = {}) => {
    if (hasConsent) {
      client.track(eventVersion, eventName, properties);
    }
  };

  return (
    <AnalyticsReactContext.Provider value={{ client, hasConsent, setConsent, track }}>
      {children}
    </AnalyticsReactContext.Provider>
  );
};

export function useAnalytics(): AnalyticsContextValue {
  const ctx = useContext(AnalyticsReactContext);
  if (!ctx) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return ctx;
}
