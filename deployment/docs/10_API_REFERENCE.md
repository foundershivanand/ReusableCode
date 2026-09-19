# API Reference: Environment & Deployment Management

## REST Endpoints

### GET `/api/deployment/metadata`
Returns current deployment metadata (`DeploymentMetadata`).

### GET `/api/deployment/config`
Returns sanitized, secret-masked environment configuration (`SanitizedConfigItem[]`).

### GET `/api/deployment/drift`
Returns configuration drift findings (`ConfigDriftFinding[]`).
