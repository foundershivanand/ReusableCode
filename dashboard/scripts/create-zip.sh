#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$DIR"

mkdir -p dashboard/public
zip -r dashboard/public/modules-bundle.zip \
  admin ai analytics audit auth billing changelog compliance core database deployment domains experimentation flags i18n maintenance metering monitoring notifications onboarding portability referral search security security-center settings storage support tenancy webhooks \
  package.json tsconfig.json vitest.config.ts \
  -x "*/node_modules/*" -x "*/.git/*" -x "*.DS_Store"

echo "✓ Created dashboard/public/modules-bundle.zip successfully!"
