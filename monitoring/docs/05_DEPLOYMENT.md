# Deployment: Product Health, Monitoring & Incident System

## Migration
Run database schema migration:
```bash
psql $DATABASE_URL -f server/migrations/001_initial_monitoring_schema.sql
```

## Kubernetes Probes Configuration
```yaml
livenessProbe:
  httpGet:
    path: /api/monitoring/live
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /api/monitoring/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```
