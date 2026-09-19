# Performance: Multi-Language & i18n

## Caching & Memory Footprint
- Translation dictionaries are grouped by namespace (`common`, `billing`, `dashboard`) so clients only load strings for active views.
- In-memory caching minimizes database or filesystem reads during request processing.
- Formatters leverage the native browser / Node.js `Intl` API for fast native performance.
