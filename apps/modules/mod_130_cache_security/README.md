# Module 130: Cache Security

Guards Redis / Memcached against cross-user cache contamination:
- Prefixes all keys with `tenant_id:user_id:`
- Enforces TTL on all cached records
