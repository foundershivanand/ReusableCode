# 06 — Multi-Tenancy Environment Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `APP_BASE_DOMAIN` | String | `app.example.com` | Base domain for subdomain parsing |
| `INVITATION_EXPIRY_DAYS` | Integer | `7` | Number of days before invitation tokens expire |
| `TENANT_DELETION_GRACE_DAYS` | Integer | `30` | Grace period in days before hard purging soft-deleted tenants |
| `MAX_WORKSPACES_PER_ORG` | Integer | `100` | Maximum workspaces allowed per organization |
