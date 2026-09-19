# 10 — Analytics API Reference

## 1. AnalyticsService Methods
- `trackEvent(input: TrackEventInput): Promise<AnalyticsEvent | null>`
- `identifyUser(userId: string, traits: Record<string, any>, consentGiven?: boolean): Promise<void>`
- `trackPageView(userId: string | undefined, path: string, referrer?: string, consentGiven?: boolean): Promise<void>`

## 2. StructuredLogger Methods
- `info(message: string, context?: LogContext): Promise<LogEntry | null>`
- `warn(message: string, context?: LogContext): Promise<LogEntry | null>`
- `error(message: string, error?: Error, context?: LogContext): Promise<LogEntry | null>`

## 3. Utility Functions
- `redactSensitiveData(obj: any): any`

## 4. Client SDK & Hooks
- `useTrack()`: `{ track: (eventVersion, eventName, properties) => void, hasConsent: boolean }`
- `useAnalytics()`: Full analytics context and controls
