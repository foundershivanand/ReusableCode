# Environment Variables: Maintenance Mode, Status & System Banners

| Variable | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `MAINTENANCE_ADMIN_BYPASS_SECRET` | String | No | - | Emergency secret token for bypassing maintenance mode |
| `MAINTENANCE_CACHE_TTL_SEC` | Integer | No | `15` | In-memory cache TTL for maintenance status |
| `MAINTENANCE_ALLOWED_IPS` | String | No | - | Comma-separated list of IP addresses exempt from maintenance |
