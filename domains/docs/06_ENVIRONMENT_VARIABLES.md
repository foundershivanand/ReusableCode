# Environment Variables: Custom Domain & White-Label Engine

| Variable | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | String | Yes | - | PostgreSQL connection URL |
| `CUSTOM_DOMAINS_CNAME_TARGET` | String | Yes | `cname.saasplatform.com` | Target hostname for customer CNAME records |
| `CUSTOM_DOMAINS_CHALLENGE_PREFIX` | String | No | `_saas-challenge` | DNS TXT record prefix for verification |
