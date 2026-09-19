# API Reference: Maintenance Mode, Status & System Banners

## REST Endpoints

### POST `/api/maintenance/check`
Evaluates maintenance status for an incoming request.
- Body: `CheckMaintenanceInput`
- Returns: `CheckMaintenanceResult`

### GET `/api/maintenance/banners?scope={scope}`
Retrieves active system banners.
- Returns: `SystemBanner[]`

### POST `/api/maintenance/config`
Configures a maintenance rule (Admin only).
- Body: `MaintenanceConfig`
- Returns: `MaintenanceConfig`

### DELETE `/api/maintenance/config/:id`
Removes a maintenance rule (Admin only).
