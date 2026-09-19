# 06 — Security Environment Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `RATE_LIMIT_LOGIN_MAX` | Integer | `5` | Max login attempts per minute |
| `RATE_LIMIT_API_MAX` | Integer | `100` | Max general API calls per minute |
| `RATE_LIMIT_AI_MAX` | Integer | `10` | Max AI completions per minute |
| `CORS_ALLOWED_ORIGINS` | String | `https://app.yourdomain.com` | Comma-delimited list of allowed CORS origins |
| `TRUSTED_PROXY_HOPS` | Integer | `1` | Number of trusted upstream proxy hops |
