# API Reference: Product Health, Monitoring & Incident System

## REST Endpoints

### GET `/api/monitoring/live`
Kubernetes liveness probe. Returns HTTP 200 `{ live: true }`.

### GET `/api/monitoring/ready`
Kubernetes readiness probe. Returns HTTP 200 `{ ready: true }` or HTTP 503 `{ ready: false, reason: "..." }`.

### GET `/api/monitoring/health?public={boolean}`
Full dependency health report (`SystemHealthReport`). Strips sensitive internal data when `public=true`.

### GET `/api/monitoring/incidents?state={state}`
Returns list of incidents.

### POST `/api/monitoring/incidents`
Creates an incident.
- Returns: `Incident`

### PUT `/api/monitoring/incidents/:id/state`
Updates an incident state.
- Body: `{ state: IncidentState, message: string, author: string, publicMessage?: string }`

### POST `/api/monitoring/incidents/:id/postmortem`
Attaches postmortem report to a resolved incident.
- Body: `Postmortem`
