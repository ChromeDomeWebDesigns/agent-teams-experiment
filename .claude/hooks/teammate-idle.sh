#!/usr/bin/env bash
# TeammateIdle: if open backlog items remain, keep the teammate working (exit 2).
# Once everything is checked off / claimed, allow idle (exit 0).
# To disable the "keep working" nudge, make this script always `exit 0`.
set -uo pipefail

root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
backlog="$root/company/BACKLOG.md"
[ -f "$backlog" ] || exit 0

# Unchecked, unblocked items look like:  - [ ] ...   (a "(blocked" marker exempts them)
if grep -E '^\s*- \[ \]' "$backlog" 2>/dev/null | grep -vqi 'blocked'; then
  echo "Open backlog items remain in company/BACKLOG.md. Claim the next unblocked one and keep working. If everything left is blocked or owned by another role, post a short status to the lead, then it's fine to idle." >&2
  exit 2
fi
exit 0
