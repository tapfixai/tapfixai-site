#!/usr/bin/env sh
set -eu

out_dir="${1:-_site}"

case "$out_dir" in
  ""|"/"|".")
    echo "Refusing to use unsafe output directory: $out_dir" >&2
    exit 1
    ;;
esac

rm -rf "$out_dir"
mkdir -p "$out_dir"

git archive --format=tar HEAD | tar -x -C "$out_dir"

rm -rf \
  "$out_dir/.github" \
  "$out_dir/_src" \
  "$out_dir/scripts"

rm -f \
  "$out_dir/.gitignore" \
  "$out_dir/.nojekyll" \
  "$out_dir/CNAME" \
  "$out_dir/README_DEPLOYMENT.md" \
  "$out_dir/google-play-data-safety-keyboard.md" \
  "$out_dir/package.json"

if [ -d "$out_dir/downloads" ]; then
  find "$out_dir/downloads" -type f ! \( -name 'TapFixAI-macOS-latest.dmg' -o -name 'TapFixAI-macOS-*.dmg' \) -delete
fi

if command -v perl >/dev/null 2>&1; then
  find "$out_dir" -type f -name '*.html' -exec perl -0pi -e 's/__PADDLE_CLIENT_TOKEN__/$ENV{PADDLE_CLIENT_TOKEN} || ""/ge' {} +
else
  find "$out_dir" -type f -name '*.html' -exec sh -c '
    token=${PADDLE_CLIENT_TOKEN:-}
    for file do
      tmp="${file}.tmp"
      awk -v token="$token" "{gsub(/__PADDLE_CLIENT_TOKEN__/, token); print}" "$file" > "$tmp"
      mv "$tmp" "$file"
    done
  ' sh {} +
fi

du -sh "$out_dir"
