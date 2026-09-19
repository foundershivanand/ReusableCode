# Future Improvements: Maintenance Mode, Status & System Banners

1. **Edge Maintenance Workers (Cloudflare/Vercel)**: Terminating maintenance traffic directly at CDN edges without hitting origin servers.
2. **Automated Drain & Quorum Checks**: Gracefully waiting for active in-flight requests to complete before switching from Read-Only to Full Maintenance.
3. **Webhook Notifications**: Emitting webhooks to third-party status aggregators (e.g. Statuspage, Better Stack).
