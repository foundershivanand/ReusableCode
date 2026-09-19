import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type {
  UserSettings,
  ResolvedPreferences,
  ProfileSettings,
  AppearanceSettings,
  LanguageSettings,
  PrivacyPreferences
} from "../schemas/index.js";
import { SettingsClient } from "./settings-client.js";

interface SettingsContextValue {
  client: SettingsClient;
  settings: UserSettings | null;
  resolved: ResolvedPreferences | null;
  loading: boolean;
  error: Error | null;
  refreshSettings: () => Promise<void>;
  updateProfile: (profile: Partial<ProfileSettings>) => Promise<void>;
  updateAppearance: (appearance: Partial<AppearanceSettings>) => Promise<void>;
  updateLanguage: (language: Partial<LanguageSettings>) => Promise<void>;
  updatePrivacy: (privacy: Partial<PrivacyPreferences>) => Promise<void>;
}

const SettingsReactContext = createContext<SettingsContextValue | null>(null);

export interface SettingsProviderProps {
  client: SettingsClient;
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ client, children }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [resolved, setResolved] = useState<ResolvedPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshSettings = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([
        client.getSettings(),
        client.getResolvedPreferences()
      ]);
      setSettings(s);
      setResolved(r);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateProfile = async (profile: Partial<ProfileSettings>) => {
    const updated = await client.updateProfile(profile);
    setSettings(updated);
  };

  const updateAppearance = async (appearance: Partial<AppearanceSettings>) => {
    const updated = await client.updateAppearance(appearance);
    setSettings(updated);
    const r = await client.getResolvedPreferences();
    setResolved(r);
  };

  const updateLanguage = async (language: Partial<LanguageSettings>) => {
    const updated = await client.updateLanguage(language);
    setSettings(updated);
    const r = await client.getResolvedPreferences();
    setResolved(r);
  };

  const updatePrivacy = async (privacy: Partial<PrivacyPreferences>) => {
    const updated = await client.updatePrivacy(privacy);
    setSettings(updated);
    const r = await client.getResolvedPreferences();
    setResolved(r);
  };

  return (
    <SettingsReactContext.Provider
      value={{
        client,
        settings,
        resolved,
        loading,
        error,
        refreshSettings,
        updateProfile,
        updateAppearance,
        updateLanguage,
        updatePrivacy
      }}
    >
      {children}
    </SettingsReactContext.Provider>
  );
};

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsReactContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
