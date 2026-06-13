# Company State

> Read this first every cycle. It is the resume point. Keep it short and current.

- **Phase:** 1 — Build
- **Product:** Vault — collection manager w/ insurance docs. Beachhead: vintage cameras/lenses.
- **Last cycle:** Cycle 1 ✅ — scaffolded `product/client` (Nuxt 2 SPA) + `product/server`
  (Express); both lint clean; server boots without creds. Committed `fd2615e`.
- **Active sprint:** none (between cycles)
- **Next action:** Cycle 2 = Firebase wiring + auth + item CRUD (data model: per-user
  `items` with photos + a `valuations` sub-collection). **Blocked on procurement:** needs a
  Firebase project + service account in `.env` (see `company/PROCUREMENT.md`). Scaffolding of
  non-Firebase UI/parts can proceed in parallel.
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
