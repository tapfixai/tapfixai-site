#!/bin/bash
set -euo pipefail

APP_NAME="TapFixAI"
PROCESS_NAME="TapFixNative"
BUNDLE_ID="ai.tapfix.native"
APP_PATH="/Applications/${APP_NAME}.app"
DMG_URL="${TAPFIX_DMG_URL:-https://raw.githubusercontent.com/tapfixai/tapfixai-site/main/downloads/TapFixAI-Testers-latest.dmg}"
TMP_DIR="$(mktemp -d /tmp/tapfixai-install.XXXXXX)"
DMG_PATH="${TMP_DIR}/TapFixAI-Testers-latest.dmg"
MOUNT_POINT=""

cleanup() {
  if [ -n "${MOUNT_POINT}" ] && [ -d "${MOUNT_POINT}" ]; then
    hdiutil detach "${MOUNT_POINT}" -quiet >/dev/null 2>&1 || true
  fi
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

echo "Installing TapFixAI tester build..."

echo "Downloading ${DMG_URL}"
curl -fL --progress-bar "${DMG_URL}" -o "${DMG_PATH}"

echo "Mounting installer..."
MOUNT_POINT="$(hdiutil attach "${DMG_PATH}" -nobrowse | awk 'index($0, "/Volumes/") {print substr($0, index($0, "/Volumes/")); exit}')"
if [ -z "${MOUNT_POINT}" ] || [ ! -d "${MOUNT_POINT}" ]; then
  echo "Could not mount TapFixAI DMG." >&2
  exit 1
fi

SOURCE_APP="${MOUNT_POINT}/${APP_NAME}.app"
if [ ! -d "${SOURCE_APP}" ]; then
  SOURCE_APP="$(find "${MOUNT_POINT}" -maxdepth 2 -name "${APP_NAME}.app" -type d | head -n 1)"
fi
if [ -z "${SOURCE_APP}" ] || [ ! -d "${SOURCE_APP}" ]; then
  echo "Could not find ${APP_NAME}.app in the DMG." >&2
  exit 1
fi

echo "Closing current TapFixAI..."
pkill -x "${PROCESS_NAME}" >/dev/null 2>&1 || true
pkill -x "${APP_NAME}" >/dev/null 2>&1 || true

echo "Installing to /Applications..."
rm -rf "${APP_PATH}" 2>/dev/null || sudo rm -rf "${APP_PATH}"
ditto "${SOURCE_APP}" "${APP_PATH}" 2>/dev/null || sudo ditto "${SOURCE_APP}" "${APP_PATH}"
xattr -dr com.apple.quarantine "${APP_PATH}" >/dev/null 2>&1 || true

echo "Starting TapFixAI..."
open -b "${BUNDLE_ID}" >/dev/null 2>&1 || open "${APP_PATH}" >/dev/null 2>&1 || true

echo "Done. If macOS asks for permissions, allow TapFixAI in Accessibility and Input Monitoring."
