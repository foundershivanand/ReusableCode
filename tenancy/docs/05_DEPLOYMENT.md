# 05 — Multi-Tenancy Deployment & Migrations

1. **Pre-Deployment Checklist**:
   - Run database migrations: `001_initial_tenancy_schema.sql`.
   - Ensure `appBaseDomain` is configured to match production apex domain.
   - Configure wildcard DNS record (`*.app.yourdomain.com`) pointing to reverse proxy/ingress.
2. **Zero-Downtime Schema Updates**:
   - Always add new columns as nullable or with defaults.
   - For slug renames, maintain redirect tables to prevent 404s on bookmarked URLs.
