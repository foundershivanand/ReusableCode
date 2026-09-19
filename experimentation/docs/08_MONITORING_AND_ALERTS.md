# Monitoring & Alerts: Experimentation & A/B Testing

## Metrics
- `experiments.active_count`: Number of currently running experiments.
- `experiments.assignments_total`: Total user assignments partitioned by variant.
- `experiments.exposures_total`: Total exposed users.
- `experiments.conversions_total`: Total conversions tracked.

## Alerts
- `SampleRatioMismatchAlert`: Fired when an active experiment exhibits significant assignment imbalance ($p < 0.01$).
- `ConversionDropAnomalyAlert`: Fired when a variant exhibits a statistically significant drop in primary metric (> 20% drop).
