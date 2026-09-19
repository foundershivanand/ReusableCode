# Monitoring & Alerts: Metering & Credit System

## Key Metrics
- `metering.events_ingested_total`: Count of ingested events partitioned by `event_type` and `status`.
- `metering.reservation_settle_latency_ms`: Duration from reservation to settlement.
- `metering.auto_recharge_total`: Counter of auto-recharge attempts partitioned by success/failure.
- `metering.expired_grants_total`: Quantity of credits expired.

## Alerts
- `HighOverageAlert`: Triggered when tenant balance drops below zero or configured alert threshold.
- `AutoRechargeFailureAlert`: Triggered when an auto-recharge payment fails.
- `StaleReservationAlert`: Triggered when pending reservations exceed 1 hour.
