#!/usr/bin/env bash
# TaskCompleted quality gate: block marking a task done if lint or tests fail.
# Exit 2 = prevent completion and feed the reason back. No-ops before product/ exists.
set -uo pipefail

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
fail=0
msg=""

for app in client server; do
  d="$root/product/$app"
  [ -f "$d/package.json" ] || continue
  [ -d "$d/node_modules" ] || continue   # deps not installed yet; skip silently

  if npm --prefix "$d" run --silent lint >/dev/null 2>&1; then :; else
    fail=1; msg="$msg\n- lint failed in product/$app (run: npm --prefix product/$app run lintfix)"
  fi

  # Only run tests if a test script is defined
  if npm --prefix "$d" run 2>/dev/null | grep -qE '^\s*test'; then
    if npm --prefix "$d" test >/dev/null 2>&1; then :; else
      fail=1; msg="$msg\n- tests failed in product/$app"
    fi
  fi
done

if [ "$fail" -eq 1 ]; then
  echo -e "Quality gate failed — fix before completing this task:$msg" >&2
  exit 2
fi
exit 0
