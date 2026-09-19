# 06 — File Storage Environment Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `STORAGE_PROVIDER` | String | `s3` | Active provider (`s3`, `cloudflare-r2`, `uploadthing`) |
| `STORAGE_S3_BUCKET` | String | - | AWS S3 or MinIO bucket name |
| `STORAGE_S3_REGION` | String | `us-east-1` | S3 region |
| `STORAGE_S3_ENDPOINT` | String | - | Custom endpoint (for MinIO / local dev) |
| `STORAGE_R2_ACCOUNT_ID` | String | - | Cloudflare account ID |
| `STORAGE_MAX_FILE_SIZE_BYTES` | Integer | `52428800` | Default per-file upload cap (50MB) |
| `STORAGE_DEFAULT_TENANT_QUOTA_BYTES` | Integer | `10737418240` | Default tenant quota (10GB) |
