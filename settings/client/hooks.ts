import { useSettings } from "./react-context.js";

export function useProfile() {
  const { settings, loading, error, updateProfile } = useSettings();
  return { profile: settings?.profile, loading, error, updateProfile };
}

export function useAppearance() {
  const { settings, resolved, loading, error, updateAppearance } = useSettings();
  return {
    appearance: settings?.appearance,
    effectiveTheme: resolved?.theme || "system",
    effectiveAccentColor: resolved?.accentColor || "#3b82f6",
    loading,
    error,
    updateAppearance
  };
}

export function usePrivacy() {
  const { settings, loading, error, updatePrivacy } = useSettings();
  return { privacy: settings?.privacy, loading, error, updatePrivacy };
}
