# Module 13: API Layer

Standardized HTTP client engine for the entire factory:
- Standardized API Response Envelope: `ApiResponse<T>` with `success`, `data`, `error`
- Retry logic with exponential backoff & jitter
- Authentication token injection & automatic 401 refresh handler
