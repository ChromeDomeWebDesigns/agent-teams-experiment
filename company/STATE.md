# Company State

> Read this first every cycle. It is the resume point. Keep it short and current.

- **Phase:** 1 — Build
- **Governance:** Human = observer. Company owns review + merge. `code-reviewer` is the sole
  merge authority (see ADR-0003 / CLAUDE.md §1–3, §7). Only human dependency = procurement.
- **Product:** Vault — collection manager w/ insurance docs. Beachhead: vintage cameras/lenses.
- **🎯 MILESTONE — Working POC due 2026-06-19 (tentative, ~7 days).** Drive toward this; do
  NOT iterate forever or gold-plate. PM must keep a crisp, measurable Definition of Done +
  per-cycle targets (formalize/confirm in `PRODUCT_BRIEF.md` in cycle 2).
  **Tentative POC Definition of Done** (PM to confirm/refine):
  1. User can sign up / log in (Firebase Auth email/password) + route-guarded app shell.
  2. Add a vintage camera/lens item: photo, make/model/serial/condition, purchase price+date,
     current value — persisted per-user in Firestore.
  3. View collection (gallery/list) with total collection value.
  4. **Generate an insurance-ready export** (printable/PDF: itemized list + photos + values +
     total + date) — the core differentiator; in-scope for POC.
  5. Quality gate: per-user Firestore security rules (deny cross-user), core flows covered by
     tests, lint clean, merged to `main`.
  - Stretch (NOT required for POC): valuation history over time; price feeds.
  - **Loop stop conditions:** POC DoD met → stop & summarize. Else continue until the
    2026-06-19 deadline, no unblocked work remains, or usage credits are exhausted.
- **Last cycle:** Cycle 1 ✅ — scaffolded `product/client` (Nuxt 2 SPA) + `product/server`
  (Express). Reviewed by `code-reviewer` and **merged to `main`** via PR #1 (squash) — the
  autonomous review→merge flow is live. `main` @ `0b920a1`.
- **Active sprint:** none (between cycles)
- **Next action:** Cycle 2 BUILT (auth + per-user item CRUD + Firestore/Storage rules +
  specs) — green (lint + 36 tests). Integrating → PR → code-reviewer merge. Then cycle 3 =
  insurance export (server PDF/print endpoint + client action) per the POC DoD. Each cycle:
  branch off `main` → PR → `code-reviewer` merges.
- **Active teammates:** none (cycle-1 team stood down)
- **Git trunk:** `main` established on remote (at bootstrap commit) and set as default;
  local `main` tracks it. Future cycles: branch off `main` → PR.
- **PR:** #1 **MERGED** (squash) — everything is on `main`. Future cycles open fresh PRs.
- **Open blockers:** none. ✅ Firebase fully provisioned + verified (live admin read OK
  2026-06-13, project `agent-teams-experiment`) — see PROCUREMENT.md. Do NOT treat Firebase
  as blocked.
- **Known governance limitation:** single GitHub account means `code-reviewer` can't formally
  `gh pr review --approve` its own-account PRs (it records the verdict as a comment, then
  squash-merges). Branch protection requiring an approving review would need a 2nd identity.
  See ADR-0004.

## Cycle log pointer
Latest detail in `company/JOURNAL.md`. `main` @ `0b920a1`. Everything lives on `main`.
