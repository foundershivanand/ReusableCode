# 01 — Analytics, Event Tracking & Logging Architecture

## 1. System Overview
The Analytics module provides a dual-pipeline telemetry architecture:
1. **Product Analytics**: Privacy-conscious event ingestion (`trackEvent`, `identifyUser`, `trackPageView`) with provider adapters for PostHog, Mixpanel, and Google Analytics.
2. **Structured Application Logging**: High-performance JSON logging (`info`, `warn`, `error`) with correlation identifiers (`requestId`, `traceId`, `tenantId`).

## 2. Event Versioning & Governance
Silently altering event payload contracts breaks downstream dashboards and data warehouses. Every analytics event requires an explicit version suffix:
`domain.action.v<number>` (e.g. `user.signed_up.v1`, `subscription.upgraded.v2`).
Events failing contract validation are rejected before ingestion.

## 3. Resilience & Failure Isolation
Analytics is strictly non-critical path. An outage in PostHog, Mixpanel, or the local analytics database **must never** crash user workflows or reject HTTP requests. All provider calls are wrapped in defensive try-catch handlers.
