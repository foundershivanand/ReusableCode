# Performance: Changelog, Roadmap & What's New

## Indexing & Read State Performance
- `changelog_items` has an index on `(status, published_at DESC)` for efficient listing of public updates.
- `changelog_read_states` uses a composite primary key `(user_id, changelog_id)` enabling $O(1)$ read status checks.
- Public changelog lists can be cached at the CDN edge with `stale-while-revalidate` caching.
