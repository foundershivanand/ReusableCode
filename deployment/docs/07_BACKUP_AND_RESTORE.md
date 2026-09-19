# Backup & Restore: Environment & Deployment Management

## Deployment Records
- Deployment audit records and drift logs are persisted in `deployment_records` and `deployment_config_audits`.
- Releases must be backed by immutable build artifacts stored in container registries (e.g. GitHub Packages, AWS ECR) tagged by git commit SHA.
