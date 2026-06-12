#!/usr/bin/env bash
# PreToolUse(Bash) safety rail.
# Blocks: pushes to main/master, and any git op using the bare github.com host
# (which would pick the wrong SSH key — global rules require the -cuddyz/-cdwd alias).
# Exit 2 = block the tool call and feed the message back to the model.
set -euo pipefail

input="$(cat)"
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
[ -z "$cmd" ] && exit 0

# Block bare github.com host (must use github.com-cuddyz / github.com-cdwd)
if printf '%s' "$cmd" | grep -qE 'git@github\.com:'; then
  echo "BLOCKED: use the SSH host alias (git@github.com-cuddyz:...) not the bare git@github.com: host." >&2
  exit 2
fi

# Block pushes to main/master
if printf '%s' "$cmd" | grep -qE '\bgit\s+push\b'; then
  if printf '%s' "$cmd" | grep -qE '(^|[ :/])(main|master)([ :]|$)'; then
    echo "BLOCKED: never push to main/master. Push a feature branch and open a PR instead." >&2
    exit 2
  fi
fi

exit 0
