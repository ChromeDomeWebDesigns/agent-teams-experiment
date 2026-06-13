#!/usr/bin/env bash
# PreToolUse(Bash) safety rail.
# Blocks: pushes to main/master, and any git op using the bare github.com host
# (which would pick the wrong SSH key — global rules require the -cuddyz/-cdwd alias).
# Exit 2 = block the tool call and feed the message back to the model.
set -uo pipefail

input="$(cat)"
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
[ -z "$cmd" ] && exit 0

# Strip quoted segments first, so commit messages / -m args / echoed text can't trip the
# checks below (e.g. `git commit -m "mentions git push to main" && git push origin feat`).
scan="$(printf '%s' "$cmd" | sed -E "s/'[^']*'//g; s/\"[^\"]*\"//g")"

# Block the bare github.com host (must use github.com-cuddyz / github.com-cdwd).
if printf '%s' "$scan" | grep -qE 'git@github\.com:'; then
  echo "BLOCKED: use the SSH host alias (git@github.com-cuddyz / -cdwd), not the bare git@github.com: host." >&2
  exit 2
fi

# Block pushes to main/master. Inspect only the push target (text AFTER 'git push').
if printf '%s' "$scan" | grep -qE '\bgit[[:space:]]+push\b'; then
  push_args="$(printf '%s' "$scan" | sed -E 's/.*\bgit[[:space:]]+push\b//')"
  if printf '%s' "$push_args" | grep -qE '(^|[[:space:]:/])(main|master)([[:space:]:]|$)'; then
    echo "BLOCKED: never push to main/master. Push a feature branch and open a PR instead." >&2
    exit 2
  fi
fi

exit 0
