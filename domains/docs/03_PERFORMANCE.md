# Performance: Custom Domain & White-Label Engine

## Host Lookup Caching
- Host-to-tenant mapping is cached in-memory (e.g. Redis or LRU cache) with short TTL (e.g. 60 seconds).
- Database query uses unique B-tree index on `custom_domains(domain)`.
- CDN cache keys must include the `Host` header to prevent cross-tenant response poisoning.
