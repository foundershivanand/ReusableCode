import type { AnalyticsProvider } from "./analytics-provider.js";
import type { AnalyticsEvent } from "../schemas/index.js";

export class PostHogAdapter implements AnalyticsProvider {
  public readonly name = "posthog";

  constructor(
    public readonly apiKey: string,
    public readonly host: string = "https://app.posthog.com"
  ) {}

  async track(_event: AnalyticsEvent): Promise<void> {
    // In production, POST to https://app.posthog.com/capture/
  }

  async identify(_userId: string, _traits: Record<string, any>): Promise<void> {
    // In production, POST to https://app.posthog.com/identify/
  }

  async page(_userId: string | undefined, _path: string, _referrer?: string): Promise<void> {
    // In production, capture $pageview event
  }
}
