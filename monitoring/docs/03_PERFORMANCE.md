# Performance: Product Health, Monitoring & Incident System

## Non-Blocking Probing
- Health checks execute asynchronously with strict timeouts (e.g. 2000ms) to ensure `/live` and `/ready` probes never hang load balancers.
- In-memory result caching (5s) prevents denial-of-service on health endpoints during traffic spikes.
