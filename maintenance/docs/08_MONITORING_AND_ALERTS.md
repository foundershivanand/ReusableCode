# Monitoring & Alerts: Maintenance Mode, Status & System Banners

## Metrics
- `maintenance.active_status`: Gauge (0: Off, 1: Read-Only, 2: Full Maintenance, 3: Degraded).
- `maintenance.blocked_requests_total`: Rate of rejected requests partitioned by scope and route.
- `maintenance.bypass_attempts_total`: Counter of admin bypass attempts partitioned by outcome (success/denied).

## Alerts
- `UnexpectedMaintenanceAlert`: Alert if maintenance mode remains active for more than 4 hours without scheduled end time.
- `BypassFailureSpike`: Alert on repeated failed bypass attempts indicating potential unauthorized probing.
