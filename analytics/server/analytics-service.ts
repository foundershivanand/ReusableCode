import crypto from "node:crypto";
import type { AnalyticsRepository } from "./repository.js";
import type { AnalyticsProvider } from "../providers/analytics-provider.js";
import {
  type AnalyticsEvent,
  type TrackEventInput,
  type LogEntry,
  type LogContextInput,
  LogContextSchema,
  TrackEventInputSchema
} from "../schemas/index.js";

const SENSITIVE_PATTERNS = [
  "password",
  "token",
  "secret",
  "authorization",
  "apikey",
  "creditcard",
  "cardnumber",
  "cvv",
  "ssn",
  "cookie"
];

export function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase().replace(/[-_]/g, "");
  return SENSITIVE_PATTERNS.some((pattern) => lower.includes(pattern));
}

/**
 * Recursively redacts sensitive keys and PII from objects
 */
export function redactSensitiveData(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = redactSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export class StructuredLogger {
  constructor(
    private repository: AnalyticsRepository,
    private samplingRate = 1.0 // 1.0 = 100%
  ) {}

  private shouldSample(level: LogEntry["level"]): boolean {
    if (level === "ERROR" || level === "WARN") return true; // Never sample errors or warnings
    return Math.random() < this.samplingRate;
  }

  async log(level: LogEntry["level"], message: string, context: LogContextInput = {}, error?: Error): Promise<LogEntry | null> {
    if (!this.shouldSample(level)) return null;

    const parsedContext = LogContextSchema.parse(context);
    const sanitizedContext = redactSensitiveData(parsedContext);
    const entry: LogEntry = {
      id: `log_${crypto.randomUUID()}`,
      level,
      message,
      context: sanitizedContext,
      timestamp: new Date(),
      errorStack: error ? error.stack : undefined
    };

    return this.repository.saveLog(entry);
  }

  async info(message: string, context: LogContextInput = {}): Promise<LogEntry | null> {
    return this.log("INFO", message, context);
  }

  async warn(message: string, context: LogContextInput = {}): Promise<LogEntry | null> {
    return this.log("WARN", message, context);
  }

  async error(message: string, error?: Error, context: LogContextInput = {}): Promise<LogEntry | null> {
    return this.log("ERROR", message, context, error);
  }
}

export class AnalyticsService {
  constructor(
    private repository: AnalyticsRepository,
    private provider?: AnalyticsProvider
  ) {}

  /**
   * Tracks an analytics event with strict schema validation, PII redaction, and consent checking.
   * Analytics failures must NEVER break core application execution.
   */
  async trackEvent(input: TrackEventInput): Promise<AnalyticsEvent | null> {
    try {
      // 1. Consent check: if user has not granted analytics consent, drop event
      if (!input.consentGiven) {
        return null;
      }

      // 2. Validate event contract
      const validated = TrackEventInputSchema.parse(input);

      // 3. Deduplication
      if (validated.idempotencyKey) {
        const existing = await this.repository.findEventByIdempotencyKey(validated.idempotencyKey);
        if (existing) return existing;
      }

      // 4. Redact properties
      const sanitizedProperties = redactSensitiveData(validated.properties);

      const event: AnalyticsEvent = {
        id: `evt_${crypto.randomUUID()}`,
        eventVersion: validated.eventVersion,
        eventName: validated.eventName,
        userId: validated.userId,
        organizationId: validated.organizationId,
        properties: sanitizedProperties,
        timestamp: new Date(),
        idempotencyKey: validated.idempotencyKey
      };

      await this.repository.saveEvent(event);

      if (this.provider) {
        await this.provider.track(event).catch(() => {
          // Failure in upstream analytics provider must never throw to caller
        });
      }

      return event;
    } catch {
      // Never throw from trackEvent
      return null;
    }
  }

  async identifyUser(userId: string, traits: Record<string, any>, consentGiven = false): Promise<void> {
    if (!consentGiven) return;
    try {
      const sanitized = redactSensitiveData(traits);
      if (this.provider) {
        await this.provider.identify(userId, sanitized).catch(() => {});
      }
    } catch {}
  }

  async trackPageView(userId: string | undefined, path: string, referrer?: string, consentGiven = false): Promise<void> {
    if (!consentGiven) return;
    try {
      if (this.provider) {
        await this.provider.page(userId, path, referrer).catch(() => {});
      }
    } catch {}
  }
}
