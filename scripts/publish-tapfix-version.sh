#!/bin/bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: scripts/publish-tapfix-version.sh v166 /path/to/TapFix-AI.dmg" >&2
  exit 1
fi

VERSION="$1"
SOURCE_DMG="$2"
KEEP_COUNT="${TAPFIX_KEEP_COUNT:-10}"
DOWNLOADS_DIR="downloads"

if [[ ! "${VERSION}" =~ ^v[0-9]+$ ]]; then
  echo "Version must look like v166." >&2
  exit 1
fi

if [ ! -f "${SOURCE_DMG}" ]; then
  echo "DMG not found: ${SOURCE_DMG}" >&2
  exit 1
fi

mkdir -p "${DOWNLOADS_DIR}"

VERSIONED_DMG="${DOWNLOADS_DIR}/TapFix-AI-${VERSION}.dmg"
LATEST_DMG="${DOWNLOADS_DIR}/TapFix-AI-latest.dmg"

if [ "$(cd "$(dirname "${SOURCE_DMG}")" && pwd)/$(basename "${SOURCE_DMG}")" != "$(cd "$(dirname "${VERSIONED_DMG}")" && pwd)/$(basename "${VERSIONED_DMG}")" ]; then
  cp "${SOURCE_DMG}" "${VERSIONED_DMG}"
fi

if [ "$(cd "$(dirname "${SOURCE_DMG}")" && pwd)/$(basename "${SOURCE_DMG}")" != "$(cd "$(dirname "${LATEST_DMG}")" && pwd)/$(basename "${LATEST_DMG}")" ]; then
  cp "${SOURCE_DMG}" "${LATEST_DMG}"
fi

find "${DOWNLOADS_DIR}" -maxdepth 1 -type f -name "TapFix-AI-v*.dmg" |
  sed -E 's#(.*/TapFix-AI-v)([0-9]+)(\.dmg)#\2 & #' |
  sort -nr |
  awk -v keep="${KEEP_COUNT}" 'NR > keep {print $2}' |
  while IFS= read -r old_file; do
    [ -n "${old_file}" ] && rm -f "${old_file}"
  done

echo "Published ${VERSIONED_DMG}"
echo "Updated ${LATEST_DMG}"
echo "Kept latest ${KEEP_COUNT} versioned DMGs."
