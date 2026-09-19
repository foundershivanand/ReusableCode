# 09 — Multi-Tenancy Future Improvements

1. **SCIM 2.0 Integration**:
   - Automated user and group provisioning from Okta, Azure AD, and OneLogin directly into organization memberships.
2. **SAML 2.0 / OIDC Per-Workspace**:
   - Enterprise single sign-on enforcement at the organization level with domain matching (e.g. `@acme.com` forced through Acme Okta).
3. **Fine-Grained Custom Roles**:
   - Allow enterprise organizations to define custom roles with selective permission sets beyond the default 4 roles.
