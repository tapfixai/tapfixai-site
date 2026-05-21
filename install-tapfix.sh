#!/bin/bash
set -euo pipefail

APP_NAME="tapfix-desktop"
BUNDLE_ID="com.marat.tapfix-desktop"
APP_PATH="/Applications/${APP_NAME}.app"
DMG_URL="${TAPFIX_DMG_URL:-https://raw.githubusercontent.com/tapfixai/tapfixai-site/main/downloads/TapFix-AI-latest.dmg}"
TMP_DIR="$(mktemp -d /tmp/tapfix-install.XXXXXX)"
DMG_PATH="${TMP_DIR}/TapFix-AI-latest.dmg"
MOUNT_POINT=""

cleanup() {
  if [ -n "${MOUNT_POINT}" ] && [ -d "${MOUNT_POINT}" ]; then
    hdiutil detach "${MOUNT_POINT}" -quiet || true
  fi
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

remove_path() {
  local target="$1"
  if [ -e "${target}" ]; then
    rm -rf "${target}" 2>/dev/null || sudo rm -rf "${target}"
  fi
}

echo "TapFix AI clean install"
echo "Closing old app..."
pkill -f "${APP_NAME}" 2>/dev/null || true

echo "Removing old app and local data..."
remove_path "${APP_PATH}"
remove_path "${HOME}/Library/Application Support/${BUNDLE_ID}"
remove_path "${HOME}/Library/Preferences/${BUNDLE_ID}.plist"
remove_path "${HOME}/Library/Caches/${BUNDLE_ID}"
remove_path "${HOME}/Library/WebKit/${BUNDLE_ID}"
remove_path "${HOME}/Library/Saved Application State/${BUNDLE_ID}.savedState"
remove_path "${HOME}/Library/Logs/TapFix"

tccutil reset Accessibility "${BUNDLE_ID}" >/dev/null 2>&1 || true
tccutil reset AppleEvents "${BUNDLE_ID}" >/dev/null 2>&1 || true
tccutil reset ListenEvent "${BUNDLE_ID}" >/dev/null 2>&1 || true

echo "Downloading TapFix AI..."
curl -fL --progress-bar "${DMG_URL}" -o "${DMG_PATH}"

echo "Mounting installer..."
MOUNT_POINT="$(hdiutil attach "${DMG_PATH}" -nobrowse -quiet | awk '/\\/Volumes\\// {print substr($0, index($0, "/Volumes/")); exit}')"
if [ -z "${MOUNT_POINT}" ] || [ ! -d "${MOUNT_POINT}" ]; then
  echo "Could not mount TapFix AI DMG." >&2
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

echo "Installing to /Applications..."
cp -R "${SOURCE_APP}" /Applications/ 2>/dev/null || sudo cp -R "${SOURCE_APP}" /Applications/
xattr -dr com.apple.quarantine "${APP_PATH}" 2>/dev/null || true

echo "Starting TapFix AI..."
open "${APP_PATH}"

echo "Done."
