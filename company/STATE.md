# Company State

> Read this first every cycle. It is the resume point. Keep it short and current.

- **Phase:** 0.5 — **PIVOT in progress** (re-direction onto the cycle 1–4 substrate, not a rewrite).
- **Governance:** Human = observer. Company owns review + merge. `code-reviewer` is the sole
  merge authority (see ADR-0003 / CLAUDE.md §1–3, §7). Only human dependency = procurement.
- **Product:** **PIVOTED 2026-06-13.** Was "Vault" (a collection ledger + insurance PDF) — the
  observer rejected it as a CRUD/spreadsheet-replacement with no real problem solved. New
  thesis: a **market-aware collection** for vintage camera/lens collectors — a *living,
  comp-backed valuation* (what's it worth today) + a *"good buy?" deal check*, riding a
  **crowd-sourced sales dataset** (the moat). Insurance export survives as a byproduct of
  accurate values, not the headline. See **ADR-0006** + rewritten `PRODUCT_BRIEF.md`.
  Beachhead unchanged: vintage cameras/lenses (market up 50–200% since 2019). Why now: there
  is no CardLadder/Discogs-equivalent *price intelligence* tool for cameras.
- **🎯 MILESTONE — Pivot POC** (PM to set a fresh, measurable DoD + deadline in the brief).
  **Proposed new POC DoD** (PM finalizing): (1) computed comp-backed estimate+range on add
  (no manual value), (2) living portfolio total, (3) deal-check verdict, (4) crowd "log a
  sale" loop shifts estimates, (5) insurance export shows comp-backed evidence, (6) quality
  gate (per-user item rules intact + `comps` rules tested + valuation/deal-check unit-tested +
  lint + reviewer-merged).
- **Substrate kept (cycles 1–4, on `main` @ `8fcdfcc`):** Firebase Auth + route guard;
  per-user `users/{uid}/items` model + proven security rules (15 emulator tests); add-item
  modal + gallery + total; insurance export end-to-end; 74 unit tests; lint gate.
- **Loop status:** ▶️ RUNNING — observer steered the pivot 2026-06-13 (chose "Both:
  valuation+deal" and "crowd-sourced comp DB"). Executing **Step 0 (repositioning)** now.
- **Active sprint:** Step 0 — rewrite `PRODUCT_BRIEF.md` (PM), ADR-0006 (CEO, done), new DoD +
  backlog + seed plan (PM), valuation/deal-check/log-a-sale UX spec (designer). Branch:
  `chore/pivot-market-intelligence`.
- **Next action:** finish Step 0 docs → PR → `code-reviewer` merges → then build cycle 5
  (backend valuation engine + comps + seed; frontend computed values + deal-check + log-a-sale;
  qa). See approved plan + `PRODUCT_BRIEF.md`.
- Each cycle: branch off `main` → PR → `code-reviewer` merges.
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
Latest detail in `company/JOURNAL.md`. `main` @ `8fcdfcc`. Everything lives on `main`.
