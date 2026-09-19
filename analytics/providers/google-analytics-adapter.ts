import type { AnalyticsProvider } from "./analytics-provider.js";
import type { AnalyticsEvent } from "../schemas/index.js";

export class GoogleAnalyticsAdapter implements AnalyticsProvider {
  public readonly name = "google-analytics";

  constructor(
    public readonly measurementId: string,
    public readonly apiSecret: string
  ) {}

  async track(_event: AnalyticsEvent): Promise<void> {
    // In production, POST to https://www.google-analytics.com/mp/collect
  }

  async identify(_userId: string, _traits: Record<string, any>): Promise<void> {}

  async page(_userId: string | undefined, _path: string, _referrer?: string): Promise<void> {}
}
