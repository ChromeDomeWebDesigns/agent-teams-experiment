#!/usr/bin/env bash
# TaskCompleted quality gate: block completion if lint/tests fail — but ONLY for packages
# that actually have changes. A docs-only task must not be blocked by unrelated package state
# (that previously pushed non-owners into product/client to make the gate pass).
# Exit 2 = prevent completion and feed the reason back. No-ops before deps are installed.
set -uo pipefail

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$root" 2>/dev/null || exit 0
fail=0
msg=""

for app in client server; do
  d="product/$app"
  [ -f "$d/package.json" ] || continue
  [ -d "$d/node_modules" ] || continue
  # Only gate a package that this change actually touched.
  [ -n "$(git status --porcelain -- "$d" 2>/dev/null)" ] || continue

  if ! npm --prefix "$d" run --silent lint >/dev/null 2>&1; then
    fail=1; msg="$msg\n- lint failed in $d (fix: npm --prefix $d run lintfix)"
  fi
  if npm --prefix "$d" run 2>/dev/null | grep -qE '^[[:space:]]*test'; then
    if ! npm --prefix "$d" test >/dev/null 2>&1; then
      fail=1; msg="$msg\n- tests failed in $d"
    fi
  fi
done

if [ "$fail" -eq 1 ]; then
  echo -e "Quality gate failed — fix before completing:$msg" >&2
  exit 2
fi
exit 0
