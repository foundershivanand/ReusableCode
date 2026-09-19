# Monitoring & Alerts: Changelog, Roadmap & What's New

## Metrics
- `changelog.views_total`: Counter of views per changelog post.
- `changelog.read_confirmations_total`: Counter of user dismissals / reads.
- `changelog.roadmap_upvotes_total`: Total upvotes submitted.

## Alerts
- `ScheduledPostMissedAlert`: Alert when a post remains in `SCHEDULED` status 30 minutes past its `scheduled_for` timestamp.
