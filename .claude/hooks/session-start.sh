#!/usr/bin/env bash
# SessionStart: surface the company's current state so the CEO re-orients from disk.
set -uo pipefail

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
state="$root/company/STATE.md"

echo "=== Company state (company/STATE.md) ==="
if [ -f "$state" ]; then
  cat "$state"
else
  echo "(no STATE.md yet — Phase 0: discovery)"
fi
exit 0
