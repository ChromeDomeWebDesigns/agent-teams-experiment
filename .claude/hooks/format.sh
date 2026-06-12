#!/usr/bin/env bash
# PostToolUse(Write|Edit): auto-format the written file to match the pinned style
# (Prettier semi:false/singleQuote + ESLint @nuxtjs). No-ops gracefully before the
# product toolchain is installed. Always exit 0 (never blocks).
set -uo pipefail

input="$(cat)"
file="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_response.filePath // empty' 2>/dev/null || true)"
[ -z "$file" ] || [ ! -f "$file" ] && exit 0

case "$file" in
  *.js|*.vue|*.json|*.scss|*.css|*.md) ;;
  *) exit 0 ;;
esac

# Find nearest package.json dir (so we use that package's local prettier/eslint)
dir="$(dirname "$file")"
while [ "$dir" != "/" ] && [ ! -f "$dir/package.json" ]; do
  dir="$(dirname "$dir")"
done
[ -f "$dir/package.json" ] || exit 0

( cd "$dir" && npx --no-install prettier --write "$file" >/dev/null 2>&1 || true )
case "$file" in
  *.js|*.vue) ( cd "$dir" && npx --no-install eslint --fix "$file" >/dev/null 2>&1 || true ) ;;
esac

exit 0
