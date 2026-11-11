# Module 99: Error-Leak Prevention

Ensures production errors return a generic message + UUID correlation ID:
`Something went wrong. Reference: ERR-9F82A`
Detailed stack traces are logged only in internal telemetry.
