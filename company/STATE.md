# Company State

> Read this first every cycle. It is the resume point. Keep it short and current.

- **Phase:** 1 — Build
- **Governance:** Human = observer. Company owns review + merge. `code-reviewer` is the sole
  merge authority (see ADR-0003 / CLAUDE.md §1–3, §7). Only human dependency = procurement.
- **Product:** Vault — collection manager w/ insurance docs. Beachhead: vintage cameras/lenses.
- **Last cycle:** Cycle 1 ✅ — scaffolded `product/client` (Nuxt 2 SPA) + `product/server`
  (Express); both lint clean; server boots without creds. Committed `fd2615e`.
- **Active sprint:** none (between cycles)
- **Next action:** (a) `code-reviewer` reviews + merges PR #1 (now also carries the
  autonomous-governance charter update) → establishes the new flow on `main`. (b) Cycle 2 =
  Firebase wiring + auth + item CRUD (data model: per-user `items` with photos + a
  `valuations` sub-collection). **Cycle 2 blocked on procurement:** Firebase project +
  service account in `.env` (see `company/PROCUREMENT.md`). Non-Firebase parts (design,
  specs) can proceed in parallel.
- **Active teammates:** none (cycle-1 team stood down)
- **Git trunk:** `main` established on remote (at bootstrap commit) and set as default;
  local `main` tracks it. Future cycles: branch off `main` → PR.
- **PR:** #1 open — https://github.com/ChromeDomeWebDesigns/agent-teams-experiment/pull/1
  (scaffold/company-bootstrap → main: discovery + scaffold + perms + git/sandbox fix).
- **Open blockers:**
  - Firebase project + service account (human procurement) — gates auth/DB wiring (cycle 2).

## Cycle log pointer
Latest detail in `company/JOURNAL.md`. Latest commit: `d177523` (shell-perms tweak).
Branch `scaffold/company-bootstrap` holds: bootstrap → discovery → scaffold → perms.
