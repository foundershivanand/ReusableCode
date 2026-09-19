# Environment Variables: Environment & Deployment Management

| Variable | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | String | Yes | `production` | Runtime environment (`development`, `test`, `production`) |
| `PORT` | Integer | No | `3000` | HTTP port listener |
| `DATABASE_URL` | String | Yes | - | PostgreSQL connection URL |
| `APP_SECRET` | String | Yes | - | Cryptographic secret for signing tokens (min 32 chars) |
| `PREVIOUS_APP_SECRET` | String | No | - | Previous secret during key rotation grace period |
| `REDIS_URL` | String | No | - | Redis cache and queue URL |
| `LOG_LEVEL` | String | No | `info` | Logging verbosity (`debug`, `info`, `warn`, `error`) |
