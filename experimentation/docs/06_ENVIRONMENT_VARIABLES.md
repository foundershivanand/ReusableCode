# Environment Variables: Experimentation & A/B Testing

| Variable | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | String | Yes | - | PostgreSQL connection URL |
| `EXPERIMENTATION_DEFAULT_ATTRIBUTION_HOURS` | Integer | No | `72` | Attribution window for conversions in hours |
| `EXPERIMENTATION_SRM_P_VALUE_THRESHOLD` | Float | No | `0.01` | Significance threshold for Sample-Ratio Mismatch |
