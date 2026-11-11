#!/usr/bin/env bash
set -euo pipefail

APP_ID="${1:-app001}"
KEYSTORE_PATH="keystores/${APP_ID}-release.jks"
ALIAS="${APP_ID}-key"

mkdir -p keystores
if [ -f "$KEYSTORE_PATH" ]; then
    echo "Error: Keystore $KEYSTORE_PATH already exists!" >&2
    exit 1
fi

echo "Generating hardware-compliant 4096-bit RSA release keystore for $APP_ID..."
keytool -genkeypair -v \
  -keystore "$KEYSTORE_PATH" \
  -alias "$ALIAS" \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000 \
  -storetype PKCS12

echo "Keystore generated at $KEYSTORE_PATH with alias $ALIAS"
