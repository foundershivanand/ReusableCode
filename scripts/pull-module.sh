#!/usr/bin/env bash
# ==============================================================================
# Pull Module Helper Script for Reusable Code Library
# Repository: https://github.com/sh15aa/Web-Reusable
#
# Usage:
#   npx degit sh15aa/Web-Reusable/<module_name> [destination_path]
#   OR
#   bash scripts/pull-module.sh <module_name> [destination_path]
#   OR via curl:
#   curl -sSL https://raw.githubusercontent.com/sh15aa/Web-Reusable/main/scripts/pull-module.sh | bash -s <module_name> [destination_path]
# ==============================================================================

set -euo pipefail

MODULE="${1:-}"
DEST="${2:-}"
REPO_OWNER="sh15aa"
REPO_NAME="Web-Reusable"
BRANCH="main"

if [ -z "$MODULE" ]; then
  echo "❌ Error: Missing module name."
  echo "Usage: pull-module.sh <module_name> [destination_path]"
  echo "Example: pull-module.sh auth src/auth"
  echo ""
  echo "Available modules:"
  echo "  admin, ai, analytics, audit, auth, billing, changelog, compliance,"
  echo "  core, dashboard, database, deployment, domains, experimentation,"
  echo "  flags, i18n, maintenance, metering, monitoring, notifications,"
  echo "  onboarding, portability, referral, search, security, security-center,"
  echo "  seo, settings, storage, support, tenancy, turso-storage, webhooks"
  exit 1
fi

if [ -z "$DEST" ]; then
  DEST="./$MODULE"
fi

echo "📦 Fetching module '$MODULE' from https://github.com/$REPO_OWNER/$REPO_NAME ($BRANCH) into '$DEST'..."

# Create destination directory
mkdir -p "$DEST"

# Method 1: Try using npx degit if available / installed
if command -v npx >/dev/null 2>&1; then
  echo "🚀 Using npx degit..."
  if npx --yes degit "$REPO_OWNER/$REPO_NAME/$MODULE#$BRANCH" "$DEST" --force; then
    echo "✅ Module '$MODULE' successfully installed into '$DEST'!"
    exit 0
  fi
  echo "⚠️ npx degit failed or unavailable, falling back to git sparse-checkout..."
fi

# Method 2: Use git sparse-checkout (shallow clone of single directory)
if command -v git >/dev/null 2>&1; then
  echo "🚀 Using git sparse-checkout..."
  TEMP_DIR=$(mktemp -d)
  git clone --depth 1 --filter=blob:none --sparse "https://github.com/$REPO_OWNER/$REPO_NAME.git" "$TEMP_DIR"
  (
    cd "$TEMP_DIR"
    git sparse-checkout set "$MODULE"
  )
  cp -r "$TEMP_DIR/$MODULE/." "$DEST/"
  rm -rf "$TEMP_DIR"
  echo "✅ Module '$MODULE' successfully copied to '$DEST'!"
  exit 0
fi

# Method 3: GitHub Tarball download via curl / tar
echo "🚀 Using GitHub archive tarball..."
TEMP_TAR=$(mktemp)
curl -sSL "https://github.com/$REPO_OWNER/$REPO_NAME/archive/refs/heads/$BRANCH.tar.gz" -o "$TEMP_TAR"
tar -xzf "$TEMP_TAR" --strip-components=2 -C "$DEST" "$REPO_NAME-$BRANCH/$MODULE"
rm -f "$TEMP_TAR"

echo "✅ Module '$MODULE' successfully extracted to '$DEST'!"
