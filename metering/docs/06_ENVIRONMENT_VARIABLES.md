# Environment Variables: Metering & Credit System

| Variable | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | String | Yes | - | PostgreSQL connection URL |
| `METERING_DEFAULT_PRICING_VERSION` | String | No | `v1` | Default pricing version for unversioned events |
| `METERING_RESERVATION_DEFAULT_TTL_SEC` | Integer | No | `300` | Default TTL for credit reservations in seconds |
| `METERING_AUTO_RECHARGE_ENABLED` | Boolean | No | `true` | Feature flag to allow auto-recharge processing |
