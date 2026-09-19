# Architecture: Maintenance Mode, Status & System Banners

## Overview
The Maintenance module enables controlled downtime, partial service degradation, read-only mode, and user notifications. It supports granular scoping across global, tenant, route, feature, and API version levels.

## Core Capabilities
1. **Modes of Operation**:
   - `FULL_MAINTENANCE`: Rejects non-bypassed requests with HTTP 503.
   - `READ_ONLY`: Permits safe read operations (GET, HEAD, OPTIONS) while blocking state-mutating requests (POST, PUT, PATCH, DELETE) with HTTP 403.
   - `DEGRADED`: Alerts users without blocking requests.
2. **Scoping**:
   - `GLOBAL`: Entire application.
   - `TENANT`: Restricts maintenance to a specific organization or customer tenant.
   - `ROUTE`: Scoped to a route URL prefix (e.g. `/api/v2/analytics`).
   - `API_VERSION`: Deprecation or migration maintenance for legacy API versions.
3. **Emergency Admin Bypass**:
   - Prevents admin lockout during critical repairs using cryptographic hash tokens, role authorization (`admin`, `superadmin`), or trusted IP allowlists.
4. **API JSON vs HTML Responses**:
   - API clients receive structured JSON error payloads with `retryAfterSeconds` instead of unexpected HTML error pages.
