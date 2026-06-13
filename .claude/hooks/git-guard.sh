#!/usr/bin/env bash
# PreToolUse(Bash) safety rail.
# Blocks: pushes to main/master, and git ops using the bare github.com host
# (which would pick the wrong SSH key — global rules require the -cuddyz/-cdwd alias).
# Exit 2 = block the tool call and feed the message back to the model.
set -uo pipefail

input="$(cat)"
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
[ -z "$cmd" ] && exit 0

# 1) Strip quoted segments so commit messages / -m args / echoed or PR-comment text never
#    trip the checks below.
scan="$(printf '%s' "$cmd" | sed -E "s/'[^']*'//g; s/\"[^\"]*\"//g")"

# 2) Split into command segments on separators so each check sees one command at a time.
segments="$(printf '%s' "$scan" | tr ';|&' '\n')"

# 3) Block the bare github.com host — ONLY when a segment is an actual `git …` command
#    (its first word is `git`), so prose/PR-comments that merely mention the host don't trip
#    it. A \bgit\b test is NOT enough: the host string `git@github.com:` itself contains
#    "git", so we require the segment to START with the git command.
if printf '%s' "$segments" | grep -E '^[[:space:]]*git[[:space:]]' | grep -qE 'git@github\.com:'; then
  echo "BLOCKED: use the SSH host alias (git@github.com-cuddyz / -cdwd), not the bare git@github.com: host." >&2
  exit 2
fi

# 4) Block pushes to main/master — inspect only the args AFTER 'git push' in each push
#    segment, so `git push origin feat && gh pr create --base main` is NOT blocked.
push_targets="$(printf '%s' "$segments" | grep -E '\bgit[[:space:]]+push\b' | sed -E 's/.*\bgit[[:space:]]+push\b//' || true)"
if [ -n "$push_targets" ] && printf '%s' "$push_targets" | grep -qE '(^|[[:space:]:/])(main|master)([[:space:]:]|$)'; then
  echo "BLOCKED: never push to main/master. Push a feature branch and open a PR instead." >&2
  exit 2
fi

exit 0
