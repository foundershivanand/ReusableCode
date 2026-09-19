import type { AnalyticsEvent, LogEntry } from "../schemas/index.js";

export interface AnalyticsRepository {
  saveEvent(event: AnalyticsEvent): Promise<AnalyticsEvent>;
  findEventByIdempotencyKey(key: string): Promise<AnalyticsEvent | null>;
  listEvents(filter?: { userId?: string; eventName?: string; limit?: number }): Promise<AnalyticsEvent[]>;
  saveLog(log: LogEntry): Promise<LogEntry>;
  listLogs(filter?: { level?: string; limit?: number }): Promise<LogEntry[]>;
}

export class InMemoryAnalyticsRepository implements AnalyticsRepository {
  private events: AnalyticsEvent[] = [];
  private logs: LogEntry[] = [];

  async saveEvent(event: AnalyticsEvent): Promise<AnalyticsEvent> {
    this.events.unshift({ ...event });
    return { ...event };
  }

  async findEventByIdempotencyKey(key: string): Promise<AnalyticsEvent | null> {
    for (const e of this.events) {
      if (e.idempotencyKey === key) {
        return { ...e };
      }
    }
    return null;
  }

  async listEvents(filter: { userId?: string; eventName?: string; limit?: number } = {}): Promise<AnalyticsEvent[]> {
    let result = this.events;
    if (filter.userId) {
      result = result.filter((e) => e.userId === filter.userId);
    }
    if (filter.eventName) {
      result = result.filter((e) => e.eventName === filter.eventName);
    }
    return result.slice(0, filter.limit || 100).map((e) => ({ ...e }));
  }

  async saveLog(log: LogEntry): Promise<LogEntry> {
    this.logs.unshift({ ...log });
    return { ...log };
  }

  async listLogs(filter: { level?: string; limit?: number } = {}): Promise<LogEntry[]> {
    let result = this.logs;
    if (filter.level) {
      result = result.filter((l) => l.level === filter.level);
    }
    return result.slice(0, filter.limit || 100).map((l) => ({ ...l }));
  }
}
