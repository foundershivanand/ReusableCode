# Environment Variables: Product Health, Monitoring & Incident System

| Variable | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | String | Yes | - | PostgreSQL connection URL |
| `MONITORING_ALERT_COOLDOWN_SEC` | Integer | No | `300` | Alert deduplication window in seconds |
| `MONITORING_PROBE_TIMEOUT_MS` | Integer | No | `2000` | Timeout for individual dependency probes |
