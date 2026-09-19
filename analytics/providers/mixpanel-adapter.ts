import type { AnalyticsProvider } from "./analytics-provider.js";
import type { AnalyticsEvent } from "../schemas/index.js";

export class MixpanelAdapter implements AnalyticsProvider {
  public readonly name = "mixpanel";

  constructor(public readonly token: string) {}

  async track(_event: AnalyticsEvent): Promise<void> {
    // In production, POST to https://api.mixpanel.com/track
  }

  async identify(_userId: string, _traits: Record<string, any>): Promise<void> {
    // In production, POST to https://api.mixpanel.com/engage
  }

  async page(_userId: string | undefined, _path: string, _referrer?: string): Promise<void> {
    // In production, track $mp_web_page_view
  }
}
