# Deployment: Custom Domain & White-Label Engine

## Migration
Run database schema migration:
```bash
psql $DATABASE_URL -f server/migrations/001_initial_domains_schema.sql
```

## Reverse Proxy / CDN Configuration
Configure your ingress controller (Cloudflare for SaaS, Vercel, or Envoy/Nginx) to forward wildcard SNI and host headers to your application cluster.
