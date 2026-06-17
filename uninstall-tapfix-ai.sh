#!/bin/bash
set -euo pipefail

APP_NAME="TapFixAI"
PROCESS_NAME="TapFixNative"
BUNDLE_ID="ai.tapfix.native"
APP_PATH="/Applications/${APP_NAME}.app"
TAPFIX_DEEP_TCC_RESET="${TAPFIX_DEEP_TCC_RESET:-0}"
TAPFIX_KEEP_LOCAL_DATA="${TAPFIX_KEEP_LOCAL_DATA:-0}"

TAPFIX_TCCUTIL_SERVICES=(
  "All"
  "Accessibility"
  "AppleEvents"
  "ListenEvent"
  "Microphone"
  "ScreenCapture"
)

TAPFIX_TCC_SERVICES=(
  "kTCCServiceAccessibility"
  "kTCCServiceAppleEvents"
  "kTCCServiceListenEvent"
  "kTCCServiceMicrophone"
  "kTCCServiceScreenCapture"
)

remove_path() {
  local target="$1"
  if [ -e "${target}" ]; then
    rm -rf "${target}" 2>/dev/null || sudo rm -rf "${target}"
  fi
}

reset_permissions() {
  echo "Resetting macOS permissions for ${BUNDLE_ID}..."
  local service
  for service in "${TAPFIX_TCCUTIL_SERVICES[@]}"; do
    tccutil reset "${service}" "${BUNDLE_ID}" >/dev/null 2>&1 || true
    sudo tccutil reset "${service}" "${BUNDLE_ID}" >/dev/null 2>&1 || true
  done

  if [ "${TAPFIX_DEEP_TCC_RESET}" = "1" ]; then
    remove_tcc_rows
  fi

  killall tccd >/dev/null 2>&1 || true
  sudo killall tccd >/dev/null 2>&1 || true
}

remove_tcc_rows() {
  if ! command -v sqlite3 >/dev/null 2>&1; then
    echo "sqlite3 not found; skipping deep privacy database cleanup."
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
    lower(client) = '${BUNDLE_ID}'
    OR lower(client) = '/applications/${APP_NAME}.app'
    OR lower(client) LIKE '/applications/${APP_NAME}.app/%'
  );
"

  local user_tcc_db="${HOME}/Library/Application Support/com.apple.TCC/TCC.db"
  local system_tcc_db="/Library/Application Support/com.apple.TCC/TCC.db"

  if [ -f "${user_tcc_db}" ]; then
    sqlite3 "${user_tcc_db}" "${sql}" >/dev/null 2>&1 \
      && echo "Removed TapFixAI rows from user privacy database." \
      || echo "Could not directly edit user privacy database; tccutil reset was still applied."
  fi

  if [ -f "${system_tcc_db}" ]; then
    sudo sqlite3 "${system_tcc_db}" "${sql}" >/dev/null 2>&1 \
      && echo "Removed TapFixAI rows from system privacy database." \
      || echo "Could not directly edit system privacy database; tccutil reset was still applied."
  fi
}

echo "Uninstalling TapFixAI..."

pkill -x "${PROCESS_NAME}" >/dev/null 2>&1 || true
pkill -x "${APP_NAME}" >/dev/null 2>&1 || true

remove_path "${APP_PATH}"

if [ "${TAPFIX_KEEP_LOCAL_DATA}" != "1" ]; then
  remove_path "${HOME}/Library/Application Support/${BUNDLE_ID}"
  remove_path "${HOME}/Library/Preferences/${BUNDLE_ID}.plist"
  remove_path "${HOME}/Library/Caches/${BUNDLE_ID}"
  remove_path "${HOME}/Library/WebKit/${BUNDLE_ID}"
  remove_path "${HOME}/Library/Saved Application State/${BUNDLE_ID}.savedState"
  remove_path "${HOME}/Library/HTTPStorages/${BUNDLE_ID}"
  remove_path "${HOME}/Library/Cookies/${BUNDLE_ID}.binarycookies"
  remove_path "${HOME}/Library/Logs/${BUNDLE_ID}"
  remove_path "${HOME}/Library/LaunchAgents/${BUNDLE_ID}.plist"
  remove_path "/tmp/tapfix-native-single-instance.lock"
fi

reset_permissions

echo "TapFixAI removed."
echo "If Privacy & Security still shows an old row, run again with TAPFIX_DEEP_TCC_RESET=1."
