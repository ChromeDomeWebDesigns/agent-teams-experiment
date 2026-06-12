# Working Agreements

Team-authored norms. The lead enforces them; teammates may propose changes via the lead
(record changes in `DECISIONS.md`).

## File ownership (avoid edit conflicts)
| Area | Path | Owner role |
|---|---|---|
| Frontend app | `product/client/**` | `frontend-engineer` |
| Backend API | `product/server/**` | `backend-engineer` |
| Tests | `**/*.spec.js`, `**/__tests__/**` | `qa-engineer` |
| Backlog / specs | `company/BACKLOG.md`, specs | `product-manager` |
| UX / design system | design specs, SCSS tokens | `product-designer` |
| Company docs / settings | `company/*`, `.claude/*`, `CLAUDE.md` | lead (CEO) |

**Rule:** no two teammates edit the same file in the same cycle. If a change spans layers,
split it into per-owner tasks and sequence them.

## Cadence (per cycle)
1. Lead orients from `STATE.md` + `git log`.
2. Lead assigns self-contained tasks (≤4 teammates).
3. Teammates implement, run `npm run lintfix`, write/extend `*.spec.js`.
4. Lead runs quality gates, commits on a feature branch, opens/refreshes a PR.
5. Lead updates `STATE.md`, `BACKLOG.md`, `JOURNAL.md`.

## Definition of done
- Lints clean (`npm run lint`) and tests pass (enforced by the `TaskCompleted` hook).
- Committed on a `feat|fix|chore|test|docs/<slug>` branch; **never pushed to main**; PR opened.
- Relevant `company/` docs updated.

## Quality bar
- Follow `CLAUDE.md` §6 conventions (logging in every catch, `_`-private helpers, Vuex shape).
- No secrets in code (`.env` + `PROCUREMENT.md` only).
- Small, reviewable commits with conventional messages.

## Stack templates
Canonical lint/format configs live in `company/stack-templates/` — copy them into each
`product/*` package when scaffolding so style matches the reference repos exactly.
