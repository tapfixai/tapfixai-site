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
  find "$out_dir/downloads" -type f ! -name 'TapFixAI-macOS-latest.dmg' -delete
fi

du -sh "$out_dir"
