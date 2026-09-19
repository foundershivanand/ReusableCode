import type { AnalyticsEvent } from "../schemas/index.js";

export interface AnalyticsProvider {
  readonly name: string;
  track(event: AnalyticsEvent): Promise<void>;
  identify(userId: string, traits: Record<string, any>): Promise<void>;
  page(userId: string | undefined, path: string, referrer?: string): Promise<void>;
}
