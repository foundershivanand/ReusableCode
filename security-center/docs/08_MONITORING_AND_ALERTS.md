# Monitoring & Alerts: Security Center & Posture Management

## Metrics
- `security.posture_score`: Current computed aggregate security score (0-100).
- `security.findings_open`: Total active open security findings partitioned by severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`).
- `security.secret_exposures_active`: Number of unrevoked secret exposures detected.
- `security.incidents_active`: Number of correlated active security incidents.

## Alerts
- `CriticalSecurityFindingAlert`: Triggered immediately when a CRITICAL severity finding is created or detected.
- `SecretExposureAlert`: Urgent notification dispatched when an API token or private key is found exposed in code or logs.
- `SecurityScoreDegradedAlert`: Fired when the aggregate posture score drops below threshold (e.g. < 70).
- `BruteForceAttackAlert`: Fired when correlated security events exceed failed login thresholds.
