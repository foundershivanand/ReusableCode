# Environment Variables: Database Migration, Backup & Disaster Recovery

| Variable | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | String | Yes | - | Primary PostgreSQL connection URL |
| `DATABASE_BACKUP_BUCKET` | String | Yes | - | S3/GCS bucket for encrypted backups |
| `DATABASE_BACKUP_ENCRYPTION_KEY` | String | Yes | - | AES-256 key for backup encryption |
| `ALLOW_DESTRUCTIVE_MIGRATIONS` | Boolean | No | `false` | Explicit override flag to permit DROP operations |
| `DATABASE_RPO_MINUTES` | Integer | No | `60` | Recovery Point Objective target in minutes |
| `DATABASE_RTO_MINUTES` | Integer | No | `120` | Recovery Time Objective target in minutes |
