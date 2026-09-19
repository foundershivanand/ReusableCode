# Performance: Environment & Deployment Management

## Zero-Downtime Rollouts
- By decoupling database migrations from code deployments using expand/contract patterns, rolling updates and blue/green deployments can run concurrently without locking tables or throwing 500 errors.
- Configuration is validated once during process initialization and cached in memory.
