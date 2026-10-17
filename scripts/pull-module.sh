#!/usr/bin/env bash
# ==============================================================================
# Pull Module Helper Script for Reusable Code Library
# Repository: https://github.com/sh15aa/Web-Reusable
#
# Usage:
#   bash scripts/pull-module.sh <module_name> [destination_path]
# ==============================================================================

set -euo pipefail

MODULE="${1:-}"
DEST="${2:-}"
REPO_URL="https://github.com/sh15aa/Web-Reusable.git"
BRANCH="main"

if [ -z "$MODULE" ]; then
  echo "❌ Error: Missing module name."
  echo "Usage: pull-module.sh <module_name> [destination_path]"
  echo "Example: pull-module.sh auth src/modules/auth"
  echo ""
  echo "Available modules (33 total):"
  echo "  admin, ai, analytics, audit, auth, billing, changelog, compliance,"
  echo "  core, dashboard, database, deployment, domains, experimentation,"
  echo "  flags, i18n, maintenance, metering, monitoring, notifications,"
  echo "  onboarding, portability, referral, search, security, security-center,"
  echo "  seo, settings, storage, support, tenancy, turso-storage, webhooks"
  exit 1
fi

if [ -z "$DEST" ]; then
  DEST="./src/modules/$MODULE"
fi

echo "📦 Fetching module '$MODULE' from $REPO_URL ($BRANCH) into '$DEST'..."
mkdir -p "$DEST"

# Method 1: Git sparse-checkout (Supports both Public and Private repos via local git credentials/SSH)
if command -v git >/dev/null 2>&1; then
  echo "🚀 Using git sparse-checkout..."
  TEMP_DIR=$(mktemp -d)
  if git clone --depth 1 --filter=blob:none --sparse "$REPO_URL" "$TEMP_DIR" 2>/dev/null; then
    (
      cd "$TEMP_DIR"
      git sparse-checkout set "$MODULE" >/dev/null 2>&1
    )
    if [ -d "$TEMP_DIR/$MODULE" ]; then
      cp -r "$TEMP_DIR/$MODULE/." "$DEST/"
      rm -rf "$TEMP_DIR"
      echo "✅ Successfully pulled '$MODULE' into '$DEST'!"
      exit 0
    else
      echo "❌ Module '$MODULE' not found in repository."
      rm -rf "$TEMP_DIR"
      exit 1
    fi
  fi
  rm -rf "$TEMP_DIR"
fi

# Method 2: npx degit fallback (if public repo)
if command -v npx >/dev/null 2>&1; then
  echo "🚀 Trying npx degit fallback..."
  if npx --yes degit "sh15aa/Web-Reusable/$MODULE#$BRANCH" "$DEST" --force 2>/dev/null; then
    echo "✅ Successfully installed '$MODULE' into '$DEST'!"
    exit 0
  fi
fi

# Method 3: GitHub Tarball fallback via curl
echo "🚀 Trying archive download fallback..."
TEMP_TAR=$(mktemp)
if curl -sSL "https://github.com/sh15aa/Web-Reusable/archive/refs/heads/$BRANCH.tar.gz" -o "$TEMP_TAR" 2>/dev/null; then
  tar -xzf "$TEMP_TAR" --strip-components=2 -C "$DEST" "Web-Reusable-$BRANCH/$MODULE" 2>/dev/null || true
  rm -f "$TEMP_TAR"
  if [ -n "$(ls -A "$DEST" 2>/dev/null)" ]; then
    echo "✅ Successfully extracted '$MODULE' into '$DEST'!"
    exit 0
  fi
fi

echo "❌ Failed to pull module '$MODULE'. Please verify git credentials or network access."
exit 1
