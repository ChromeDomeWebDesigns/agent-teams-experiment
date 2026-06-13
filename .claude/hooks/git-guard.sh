#!/usr/bin/env bash
# PreToolUse(Bash) safety rail.
# Blocks: pushes to main/master, and any git op using the bare github.com host
# (which would pick the wrong SSH key — global rules require the -cuddyz/-cdwd alias).
# Exit 2 = block the tool call and feed the message back to the model.
set -uo pipefail

input="$(cat)"
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
[ -z "$cmd" ] && exit 0

# 1) Strip quoted segments so commit messages / -m args / echoed text never trip checks.
scan="$(printf '%s' "$cmd" | sed -E "s/'[^']*'//g; s/\"[^\"]*\"//g")"

# 2) Block the bare github.com host (must use github.com-cuddyz / github.com-cdwd).
if printf '%s' "$scan" | grep -qE 'git@github\.com:'; then
  echo "BLOCKED: use the SSH host alias (git@github.com-cuddyz / -cdwd), not the bare git@github.com: host." >&2
  exit 2
fi

# 3) Block pushes to main/master. Split the command into segments on separators
#    (; | & and newlines), keep only the 'git push' segments, and inspect just the
#    args AFTER 'git push' in each — so `git push origin feat && gh pr create --base main`
#    (the --base main belongs to gh, not the push) does NOT trip it.
push_targets="$(printf '%s' "$scan" | tr ';|&' '\n' | grep -E '\bgit[[:space:]]+push\b' | sed -E 's/.*\bgit[[:space:]]+push\b//' || true)"
if [ -n "$push_targets" ] && printf '%s' "$push_targets" | grep -qE '(^|[[:space:]:/])(main|master)([[:space:]:]|$)'; then
  echo "BLOCKED: never push to main/master. Push a feature branch and open a PR instead." >&2
  exit 2
fi

exit 0
