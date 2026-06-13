#!/usr/bin/env bash
# TeammateIdle: allow teammates to go idle (exit 0 — no forced continuation).
#
# A previous version exited 2 ("keep working") whenever BACKLOG.md had any open item. That
# isn't role-aware, so idle teammates with nothing claimable got nudged in a loop, burning
# tokens. The CEO now owns teammate lifecycle (assign the next task or shut them down), so
# this hook no longer forces continuation.
exit 0
