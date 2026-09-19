# API Reference: Security Center & Posture Management

## REST Endpoints

### GET `/api/security/score`
Calculates and returns the current aggregate security posture score and breakdown.
- Returns: `SecurityScore`

### GET `/api/security/findings`
Lists all security findings with optional filtering.
- Query params: `severity`, `status`, `category`
- Returns: `SecurityFinding[]`

### POST `/api/security/findings/:id/status`
Updates finding lifecycle state (e.g. OPEN, IN_PROGRESS, CLOSED).
- Body: `{ status: FindingStatus, resolutionNotes?: string }`
- Returns: `SecurityFinding`

### POST `/api/security/findings/:id/suppress`
Suppresses a false positive with expiration and mandatory rationale.
- Body: `{ reason: string, expiresAt: string }`
- Returns: `SecurityFinding`

### POST `/api/security/scans/run`
Triggers an automated configuration check and returns detected findings.
- Body: `{ config: SecurityConfigInput }`
- Returns: `{ findingsCreated: number, findings: SecurityFinding[] }`

### POST `/api/security/secrets/detect`
Registers an exposed secret, initiates alerting, and marks status.
- Body: `{ secretType: string, location: string, fingerprint: string, rawSnippet?: string }`
- Returns: `SecretExposure`

### POST `/api/security/secrets/:id/revoke`
Marks an exposed secret as revoked and inactive.
- Returns: `SecretExposure`
