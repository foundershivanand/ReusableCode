# Performance: Experimentation & A/B Testing

## Local Evaluation & Caching
- Deterministic hashing allows variant evaluation in $O(1)$ time in memory without database roundtrips.
- Exposure events and conversion records can be buffered and flushed in batches to avoid high-frequency database writes during traffic spikes.
