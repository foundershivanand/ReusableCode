# 01 — Settings, Preferences & Customization Architecture

## 1. Overview
The Settings module manages structured, typed user and organization preferences. It eliminates arbitrary, unvalidated JSON blobs in favor of strict Zod schemas, backward-compatible version migrations, and a deterministic hierarchy of precedence.

## 2. Preference Precedence Hierarchy
When calculating effective settings for an active user session, `resolvePreferences()` evaluates the following hierarchy from lowest to highest priority:
1. **System Default**: Hardcoded baseline values (`theme: system`, `locale: en`, `timezone: UTC`).
2. **Product Default**: Platform-wide configuration set in environment or application code.
3. **Organization Setting**: Tenant-level defaults (`defaultTheme`, `enforceMfa`, `allowedEmailDomains`).
4. **User Setting**: The user's explicit profile choices stored in `user_settings`.
5. **Session-Specific Override**: Transient runtime overrides (e.g. client cookie, ephemeral locale switch).

## 3. Schema Versioning & Safe Migration
Settings evolve over time. To avoid breaking existing user accounts when new fields or structures are introduced:
- Settings payloads carry a numeric `schemaVersion` (v1 -> v2 -> v3).
- On read, if `schemaVersion < 3`, the `migrateToV3()` pipeline applies declarative transformations.
- If data corruption occurs, the system falls back safely to default values rather than crashing the application.
