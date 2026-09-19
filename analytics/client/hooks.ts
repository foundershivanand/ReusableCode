import { useAnalytics } from "./react-context.js";
import { useCallback } from "react";

export function useTrack() {
  const { track, hasConsent } = useAnalytics();
  const trackEvent = useCallback(
    (eventVersion: string, eventName: string, properties?: Record<string, any>) => {
      track(eventVersion, eventName, properties);
    },
    [track]
  );
  return { track: trackEvent, hasConsent };
}
