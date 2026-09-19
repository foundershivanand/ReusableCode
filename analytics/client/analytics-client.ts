import type { TrackEventInput } from "../schemas/index.js";

export interface AnalyticsClientOptions {
  baseUrl?: string;
  hasConsent?: () => boolean;
}

export class AnalyticsClient {
  private baseUrl: string;
  private hasConsent: () => boolean;

  constructor(options: AnalyticsClientOptions = {}) {
    this.baseUrl = options.baseUrl || "/api/analytics";
    this.hasConsent = options.hasConsent || (() => false);
  }

  async track(eventVersion: string, eventName: string, properties: Record<string, any> = {}): Promise<void> {
    if (!this.hasConsent()) return;

    const payload: TrackEventInput = {
      eventVersion,
      eventName,
      properties,
      consentGiven: true
    };

    // Use sendBeacon if available, otherwise fetch with keepalive
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon(`${this.baseUrl}/track`, blob);
    } else {
      await fetch(`${this.baseUrl}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {});
    }
  }

  async page(path: string, referrer?: string): Promise<void> {
    if (!this.hasConsent()) return;
    await fetch(`${this.baseUrl}/page`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, referrer }),
      keepalive: true
    }).catch(() => {});
  }
}
