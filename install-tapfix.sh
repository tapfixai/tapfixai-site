#!/bin/bash
set -euo pipefail

APP_NAME="tapfix-desktop"
BUNDLE_ID="com.marat.tapfix-desktop"
APP_PATH="/Applications/${APP_NAME}.app"
DMG_URL="${TAPFIX_DMG_URL:-https://raw.githubusercontent.com/tapfixai/tapfixai-site/main/downloads/TapFix-AI-latest.dmg}"
TMP_DIR="$(mktemp -d /tmp/tapfix-install.XXXXXX)"
DMG_PATH="${TMP_DIR}/TapFix-AI-latest.dmg"
MOUNT_POINT=""
TAPFIX_BUNDLE_IDS=("${BUNDLE_ID}")
TAPFIX_TCC_SERVICES=(
  "kTCCServiceAccessibility"
  "kTCCServiceAppleEvents"
  "kTCCServiceListenEvent"
  "kTCCServiceMicrophone"
)

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

remove_glob() {
  local pattern="$1"
  local match
  while IFS= read -r match; do
    remove_path "${match}"
  done < <(compgen -G "${pattern}" || true)
}

add_bundle_id() {
  local candidate="${1:-}"
  if [ -z "${candidate}" ]; then
    return
  fi

  local existing
  for existing in "${TAPFIX_BUNDLE_IDS[@]}"; do
    if [ "${existing}" = "${candidate}" ]; then
      return
    fi
  done

  TAPFIX_BUNDLE_IDS+=("${candidate}")
}

reset_tapfix_permissions() {
  local bundle_id
  for bundle_id in "${TAPFIX_BUNDLE_IDS[@]}"; do
    echo "Resetting TapFix permissions for ${bundle_id}..."
    tccutil reset Accessibility "${bundle_id}" >/dev/null 2>&1 || true
    tccutil reset AppleEvents "${bundle_id}" >/dev/null 2>&1 || true
    tccutil reset ListenEvent "${bundle_id}" >/dev/null 2>&1 || true
    tccutil reset Microphone "${bundle_id}" >/dev/null 2>&1 || true
  done

  remove_tapfix_tcc_rows
  killall tccd >/dev/null 2>&1 || true
}

remove_tapfix_tcc_rows() {
  local tcc_db="${HOME}/Library/Application Support/com.apple.TCC/TCC.db"
  if [ ! -f "${tcc_db}" ]; then
    return
  fi

  if ! command -v sqlite3 >/dev/null 2>&1; then
    echo "sqlite3 not found; skipping deep TapFix permission cleanup."
    return
  fi

  local service_list=""
  local service
  for service in "${TAPFIX_TCC_SERVICES[@]}"; do
    if [ -n "${service_list}" ]; then
      service_list="${service_list},"
    fi
    service_list="${service_list}'${service}'"
  done

  local sql="
PRAGMA busy_timeout=3000;
DELETE FROM access
WHERE service IN (${service_list})
  AND (
    lower(client) LIKE '%tapfix%'
    OR lower(client) LIKE '%com.marat.tapfix-desktop%'
    OR lower(client) LIKE '%tapfix-desktop%'
  );
"

  if sqlite3 "${tcc_db}" "${sql}" >/dev/null 2>&1; then
    echo "Removed stale TapFix permission rows from macOS privacy database."
  else
    echo "Could not directly edit macOS privacy database; tccutil reset was still applied."
    echo "If TapFix stays stuck in Privacy & Security, remove the old row manually once."
  fi
}

echo "TapFix AI clean install"
echo "Closing old app..."
pkill -f "${APP_NAME}" 2>/dev/null || true

echo "Removing old app and local data..."
if [ -d "${APP_PATH}" ]; then
  add_bundle_id "$(defaults read "${APP_PATH}/Contents/Info" CFBundleIdentifier 2>/dev/null || true)"
fi

remove_path "${APP_PATH}"

for tapfix_id in "${TAPFIX_BUNDLE_IDS[@]}"; do
  remove_path "${HOME}/Library/Application Support/${tapfix_id}"
  remove_path "${HOME}/Library/Preferences/${tapfix_id}.plist"
  remove_path "${HOME}/Library/Caches/${tapfix_id}"
  remove_path "${HOME}/Library/WebKit/${tapfix_id}"
  remove_path "${HOME}/Library/Saved Application State/${tapfix_id}.savedState"
  remove_path "${HOME}/Library/HTTPStorages/${tapfix_id}"
  remove_path "${HOME}/Library/Cookies/${tapfix_id}.binarycookies"
  remove_path "${HOME}/Library/Logs/${tapfix_id}"
done

remove_path "${HOME}/Library/Logs/TapFix"
remove_path "${HOME}/Library/LaunchAgents/TapFix AI.plist"
remove_path "${HOME}/Library/LaunchAgents/${BUNDLE_ID}.plist"
remove_path "/tmp/tapfix-desktop-single-instance.lock"
remove_glob "${HOME}/Library/Application Support/CrashReporter/${APP_NAME}_*.plist"
reset_tapfix_permissions

echo "Downloading TapFix AI..."
curl -fL --progress-bar "${DMG_URL}" -o "${DMG_PATH}"

echo "Mounting installer..."
if [ -d "/Volumes/tapfix-desktop" ]; then
  hdiutil detach "/Volumes/tapfix-desktop" -quiet || true
fi

MOUNT_POINT="$(hdiutil attach "${DMG_PATH}" -nobrowse | awk 'index($0, "/Volumes/") {print substr($0, index($0, "/Volumes/")); exit}')"
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
