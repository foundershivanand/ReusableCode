# Monitoring & Alerts: Environment & Deployment Management

## Metrics
- `deployment.status`: Gauge indicating active deployment status.
- `deployment.drift_detected`: Boolean flag indicating configuration divergence.
- `deployment.gate_duration_seconds`: Time taken for CI/CD deployment gates.

## Alerts
- `ConfigDriftAlert`: Triggered when critical environment variables differ from declared baseline.
- `DeploymentGateFailedAlert`: Triggered when a production deployment fails automated gates.
