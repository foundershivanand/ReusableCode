# Security: Database Migration, Backup & Disaster Recovery

## Backup Encryption & Access Isolation
- Backups are client-side encrypted using AES-256-GCM before transmission to remote cloud storage.
- Storage buckets employ WORM (Write Once, Read Many) object locking with retention compliance mode to prevent ransomware from deleting or encrypting backups.
- Backups reside in an isolated cloud account with separate IAM credentials from the production application.

## Zero Credential Exposure
- Production database connection strings are never exposed to browser clients or frontend code.
