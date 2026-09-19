# Future Improvements: Product Health, Monitoring & Incident System

1. **Synthetic User Flow Probing**: Automatically running automated Playwright/Puppeteer user journeys (e.g. login, checkout) every 5 minutes.
2. **PagerDuty / Opsgenie Webhook Dispatch**: Direct on-call paging integration on SEV1/SEV2 incident creation.
3. **OpenTelemetry Trace Correlation**: Linking incident alerts to distributed trace spans in Jaeger or Datadog.
