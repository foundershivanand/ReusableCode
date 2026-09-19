# Backup & Restore: Maintenance Mode, Status & System Banners

## Maintenance State Recovery
- Maintenance configurations and banners are stored in PostgreSQL tables `maintenance_configs` and `maintenance_system_banners`.
- If database is offline, an in-memory emergency override can be activated via environment variables to serve maintenance responses directly at reverse proxy/CDN level.
