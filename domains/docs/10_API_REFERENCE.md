# API Reference: Custom Domain & White-Label Engine

## REST Endpoints

### GET `/api/domains?tenantId={tenantId}`
Lists all registered custom domains for the tenant.

### POST `/api/domains/request`
Requests a new custom domain and generates DNS challenge tokens.
- Body: `RequestDomainInput`
- Returns: `CustomDomain`

### POST `/api/domains/:id/verify`
Triggers DNS verification check.
- Body: `{ tenantId: string }`
- Returns: `CustomDomain`

### DELETE `/api/domains/:id?tenantId={tenantId}`
Removes a custom domain and deletes routing entries.

### GET `/api/domains/branding?tenantId={tenantId}`
Retrieves tenant branding configuration.

### PUT `/api/domains/branding`
Updates tenant branding configuration.
- Body: `UpdateBrandingInput`
- Returns: `TenantBranding`
