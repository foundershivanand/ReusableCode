# 03 — Analytics Performance & Controlled Sampling

## 1. Controlled Log Sampling
High-volume production environments generate millions of informational log lines. `StructuredLogger` supports configurable sampling rates (e.g. 10% for `INFO` and `DEBUG`), while always guaranteeing 100% ingestion for `WARN` and `ERROR` logs.

## 2. Browser sendBeacon Delivery
Client-side event tracking uses `navigator.sendBeacon()` or `fetch(..., { keepalive: true })`. This guarantees events are delivered reliably even when the user navigates away or closes the browser tab, without blocking page teardown.
