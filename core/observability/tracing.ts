import { AsyncLocalStorage } from "node:async_hooks";
import { generatePrefixedId } from "../ids/ids.js";
import { redactSensitiveObject } from "../secrets/secrets.js";

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  correlationId: string;
  tenantId?: string;
  actorId?: string;
  route?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<TraceContext>();

export function getTraceContext(): TraceContext | undefined {
  return asyncLocalStorage.getStore();
}

export function runWithTraceContext<T>(context: TraceContext, fn: () => T | Promise<T>): T | Promise<T> {
  return asyncLocalStorage.run(context, fn);
}

export function createTraceContext(params?: Partial<TraceContext>): TraceContext {
  const traceId = params?.traceId || generatePrefixedId("trace");
  return {
    traceId,
    spanId: params?.spanId || generatePrefixedId("span"),
    parentSpanId: params?.parentSpanId,
    correlationId: params?.correlationId || traceId,
    tenantId: params?.tenantId,
    actorId: params?.actorId,
    route: params?.route,
  };
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  traceId?: string;
  spanId?: string;
  correlationId?: string;
  tenantId?: string;
  actorId?: string;
  details?: Record<string, unknown>;
}

export class StructuredLogger {
  constructor(private serviceName: string = "app") {}

  private log(level: LogLevel, message: string, details?: Record<string, unknown>) {
    const ctx = getTraceContext();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      traceId: ctx?.traceId,
      spanId: ctx?.spanId,
      correlationId: ctx?.correlationId,
      tenantId: ctx?.tenantId,
      actorId: ctx?.actorId,
      details: details ? redactSensitiveObject(details) : undefined,
    };

    // In production this outputs JSON to stdout/collector
    if (process.env.NODE_ENV !== "test") {
      const output = JSON.stringify({ service: this.serviceName, ...entry });
      if (level === "error") {
        console.error(output);
      } else if (level === "warn") {
        console.warn(output);
      } else {
        console.log(output);
      }
    }
  }

  debug(msg: string, details?: Record<string, unknown>) {
    this.log("debug", msg, details);
  }

  info(msg: string, details?: Record<string, unknown>) {
    this.log("info", msg, details);
  }

  warn(msg: string, details?: Record<string, unknown>) {
    this.log("warn", msg, details);
  }

  error(msg: string, details?: Record<string, unknown>) {
    this.log("error", msg, details);
  }
}

export const logger = new StructuredLogger("core");
