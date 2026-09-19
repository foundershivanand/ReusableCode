# 06 — Admin Environment Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `ADMIN_INACTIVITY_TIMEOUT_MINUTES` | Integer | `15` | Idle minutes before admin session expires |
| `ADMIN_ABSOLUTE_LIFETIME_HOURS` | Integer | `8` | Maximum duration of an admin session |
| `ADMIN_ENFORCE_MFA` | Boolean | `true` | Whether MFA is strictly required for admin logins |
| `ADMIN_ALLOW_IMPERSONATION` | Boolean | `true` | Master switch to enable/disable user impersonation |
| `ADMIN_MAX_BREAK_GLASS_MINUTES` | Integer | `120` | Upper limit on break-glass duration |
