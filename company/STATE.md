# Company State

> Read this first every cycle. It is the resume point. Keep it short and current.

- **Phase:** 1 — Build
- **Governance:** Human = observer. Company owns review + merge. `code-reviewer` is the sole
  merge authority (see ADR-0003 / CLAUDE.md §1–3, §7). Only human dependency = procurement.
- **Product:** Vault — collection manager w/ insurance docs. Beachhead: vintage cameras/lenses.
- **Last cycle:** Cycle 1 ✅ — scaffolded `product/client` (Nuxt 2 SPA) + `product/server`
  (Express). Reviewed by `code-reviewer` and **merged to `main`** via PR #1 (squash) — the
  autonomous review→merge flow is live. `main` @ `0b920a1`.
- **Active sprint:** none (between cycles)
- **Next action:** Cycle 2 = Firebase wiring + auth + item CRUD (data model: per-user
  `items` with photos + a `valuations` sub-collection). **Blocked on procurement:** Firebase
  project + service account in `.env` (see `company/PROCUREMENT.md`). Non-Firebase parts
  (design, specs) can proceed in parallel. Each cycle: branch off `main` → PR →
  `code-reviewer` merges.
- **Active teammates:** none (cycle-1 team stood down)
- **Git trunk:** `main` established on remote (at bootstrap commit) and set as default;
  local `main` tracks it. Future cycles: branch off `main` → PR.
- **PR:** #1 **MERGED** (squash) — everything is on `main`. Future cycles open fresh PRs.
- **Open blockers:**
  - Firebase project + service account (human procurement) — gates auth/DB wiring (cycle 2).
- **Known governance limitation:** single GitHub account means `code-reviewer` can't formally
  `gh pr review --approve` its own-account PRs (it records the verdict as a comment, then
  squash-merges). Branch protection requiring an approving review would need a 2nd identity.
  See ADR-0004.

## Cycle log pointer
Latest detail in `company/JOURNAL.md`. `main` @ `0b920a1`. Everything lives on `main`.
