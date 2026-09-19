# Deployment: Security Center & Compliance Dashboard

## Migration
Execute the schema migration:
```bash
psql $DATABASE_URL -f server/migrations/001_initial_security_center_schema.sql
```

## CI/CD Security Regression Gate
Configure automated security checks in your CI/CD pipeline:
```bash
pnpm test:security
```
This ensures security headers, cookie flags, and environment configurations do not silently regress in new releases.
