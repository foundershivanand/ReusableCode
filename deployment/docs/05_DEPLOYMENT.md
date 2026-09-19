# Deployment: Environment & Deployment Management

## Deployment Platforms

### 1. Vercel
- Set environment variables in Vercel Project Settings (`DATABASE_URL`, `APP_SECRET`).
- Configure `vercel.json` with build commands and serverless function regions.
- Ensure immutable deployments with Git branch integrations (preview vs production).

### 2. Cloudflare
- Deploy frontend to Cloudflare Pages and backend to Cloudflare Workers or Container instances.
- Store secrets using `wrangler secret put APP_SECRET`.
- Use Cloudflare for SaaS to handle custom domain SSL automation.

### 3. Docker
- Use multi-stage Dockerfile:
  ```dockerfile
  FROM node:22-alpine AS builder
  WORKDIR /app
  COPY package.json pnpm-lock.yaml ./
  RUN pnpm install --frozen-lockfile
  COPY . .
  RUN pnpm build

  FROM node:22-alpine AS runner
  WORKDIR /app
  ENV NODE_ENV=production
  COPY --from=builder /app/dist ./dist
  COPY --from=builder /app/node_modules ./node_modules
  EXPOSE 3000
  CMD ["node", "dist/index.js"]
  ```

### 4. Generic VPS (Ubuntu / Debian + Systemd + Nginx)
- Configure Systemd service: `/etc/systemd/system/app.service`.
- Nginx reverse proxy with TLS termination via Certbot/Let's Encrypt.
- Deploy immutable build tarballs rather than building directly on production VPS.
