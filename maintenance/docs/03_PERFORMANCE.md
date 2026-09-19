# Performance: Maintenance Mode, Status & System Banners

## Fast Path Evaluation
- Maintenance middleware executes at the very beginning of the request pipeline.
- In-memory caching with short TTL (e.g. 5-15 seconds) avoids database hits for every incoming HTTP request.
- When maintenance is active, requests are terminated immediately before initializing heavy database connections or session deserialization.
