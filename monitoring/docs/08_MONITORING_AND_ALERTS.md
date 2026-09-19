# Monitoring & Alerts: Product Health, Monitoring & Incident System

## Metrics
- `monitoring.liveness_probe_failures_total`: Count of liveness probe failures.
- `monitoring.readiness_probe_failures_total`: Count of readiness probe failures.
- `monitoring.dependency_latency_seconds`: Histogram of dependency probe durations.

## Alerts
- `CriticalDependencyDownAlert`: Fired when a critical dependency check fails consecutively.
- `SloBreachAlert`: Fired when an SLO compliance percentage falls below target.
