#!/usr/bin/env bash
# ==============================================================================
# Universal Pull Module Helper Script for Unified Reusable Code Library
# Repository: https://github.com/sh15aa/Web-Reusable
# Supports: Web Apps (33), Bots (27), AI Agents (40), Mobile Apps (163)
# ==============================================================================

set -euo pipefail

TARGET="${1:-}"
DEST="${2:-}"
REPO_URL="https://github.com/sh15aa/Web-Reusable.git"
BRANCH="main"

if [ -z "$TARGET" ]; then
  echo "❌ Error: Missing module name or path."
  echo "Usage: pull-module.sh <module_identifier_or_path> [destination_path]"
  echo ""
  echo "Examples:"
  echo "  Web Apps:     pull-module.sh auth src/modules/auth"
  echo "  Web Apps:     pull-module.sh web/billing src/modules/billing"
  echo "  Bots:         pull-module.sh bots/app/adapters/telegram.py ./bots/telegram.py"
  echo "  AI Agents:    pull-module.sh agents/agent_factory ./lib/agent_factory"
  echo "  Mobile Apps:  pull-module.sh apps/modules/mod_01_product_idea_engine ./packages/idea_engine"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Resolve alias paths if needed
RESOLVED_PATH="$TARGET"
if [ ! -e "$REPO_ROOT/$TARGET" ]; then
  if [ -e "$REPO_ROOT/web/$TARGET" ]; then
    RESOLVED_PATH="web/$TARGET"
  elif [ -e "$REPO_ROOT/apps/modules/$TARGET" ]; then
    RESOLVED_PATH="apps/modules/$TARGET"
  fi
fi

if [ -z "$DEST" ]; then
  BASENAME=$(basename "$TARGET")
  DEST="./src/modules/$BASENAME"
fi

echo "📦 Fetching '$TARGET' from $REPO_URL ($BRANCH) into '$DEST'..."

# Method 1: Local copy if running inside the repository clone
SOURCE_PATH="$REPO_ROOT/$TARGET"
if [ ! -e "$SOURCE_PATH" ]; then
  SOURCE_PATH="$REPO_ROOT/$RESOLVED_PATH"
fi

if [ -e "$SOURCE_PATH" ]; then
  if [ -d "$SOURCE_PATH" ]; then
    mkdir -p "$DEST"
    cp -r "$SOURCE_PATH/." "$DEST/"
  else
    mkdir -p "$(dirname "$DEST")"
    cp "$SOURCE_PATH" "$DEST"
  fi
  echo "✅ Successfully copied '$TARGET' into '$DEST' from local library!"
  exit 0
fi

# Method 2: Git sparse-checkout (Supports both Public and Private repos)
if command -v git >/dev/null 2>&1; then
  echo "🚀 Using git sparse-checkout..."
  TEMP_DIR=$(mktemp -d)
  if git clone --depth 1 --filter=blob:none --sparse "$REPO_URL" "$TEMP_DIR" 2>/dev/null; then
    (
      cd "$TEMP_DIR"
      git sparse-checkout set "$RESOLVED_PATH" "$TARGET" >/dev/null 2>&1
    )
    FOUND_PATH=""
    if [ -e "$TEMP_DIR/$RESOLVED_PATH" ]; then
      FOUND_PATH="$TEMP_DIR/$RESOLVED_PATH"
    elif [ -e "$TEMP_DIR/$TARGET" ]; then
      FOUND_PATH="$TEMP_DIR/$TARGET"
    fi

    if [ -n "$FOUND_PATH" ]; then
      if [ -d "$FOUND_PATH" ]; then
        mkdir -p "$DEST"
        cp -r "$FOUND_PATH/." "$DEST/"
      else
        mkdir -p "$(dirname "$DEST")"
        cp "$FOUND_PATH" "$DEST"
      fi
      rm -rf "$TEMP_DIR"
      echo "✅ Successfully pulled '$TARGET' into '$DEST'!"
      exit 0
    fi
  fi
  rm -rf "$TEMP_DIR"
fi

echo "❌ Failed to pull module '$TARGET'. Please verify git credentials or target path."
exit 1
