# Architecture: Custom Domain & White-Label Engine

## Overview
The Custom Domain & White-Label module allows multi-tenant SaaS platforms to provide custom domain routing, automated DNS verification, SSL certificate provisioning, and tenant-specific branding (logos, color themes, email sender domains).

## Core Concepts
1. **Ownership Challenge & Lifecycle**:
   - `REQUESTED` -> `VERIFYING` -> `VERIFIED` -> `ACTIVE` -> `FAILED` -> `DISABLED`.
   - Domain claiming requires setting a unique cryptographic TXT challenge token and CNAME record.
2. **Host Routing & Isolation**:
   - Host headers are sanitized to prevent host-header injection attacks.
   - Domains strictly resolve to the tenant ID that successfully passed ownership verification.
   - Unverified or disabled domains fail routing immediately.
3. **White-Label Branding**:
   - Independent branding configurations per tenant (company name, primary/accent colors, logo, favicon).
   - Tenant asset isolation ensures Customer A cannot access or tamper with Customer B's branding.
4. **Email Sender Domain Verification**:
   - Prevents email spoofing by verifying that outgoing email sender domains match verified custom domains belonging to the tenant.
