# 08 — Analytics Monitoring & Operational Alarms

1. **Key Metrics**:
   - `analytics_events_tracked_total`: Counter of successfully ingested events.
   - `analytics_events_dropped_no_consent`: Counter of events dropped due to privacy preferences.
   - `logs_errors_total`: Count of ERROR level application logs.
2. **Alert Conditions**:
   - High: Spike in `logs_errors_total` (>50 errors in 5 minutes).
   - Medium: Drop in `analytics_events_tracked_total` compared to typical baseline.
