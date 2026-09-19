# 06 — Analytics Environment Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `ANALYTICS_PROVIDER` | String | `posthog` | Primary analytics provider (`posthog`, `mixpanel`, `google-analytics`) |
| `POSTHOG_API_KEY` | String | - | PostHog project API key |
| `POSTHOG_HOST` | String | `https://app.posthog.com` | PostHog instance host |
| `MIXPANEL_TOKEN` | String | - | Mixpanel project token |
| `LOG_SAMPLING_RATE` | Float | `1.0` | Sampling rate for INFO/DEBUG logs (0.0 to 1.0) |
| `LOG_LEVEL` | String | `INFO` | Minimum log level to capture (`DEBUG`, `INFO`, `WARN`, `ERROR`) |
