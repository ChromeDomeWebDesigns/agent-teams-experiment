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
  - **Progress (2026-06-13):** #1 auth ✅ · #2 add-item ✅ · #3 gallery+total ✅ ·
    #4 insurance export ⏳ (cycle 3) · #5 quality gate ✅ (rules + 36 tests + lint + merged;
    `AddItemModal` still needs its own test). ≈ 3.5 / 5.
- **Last cycle:** Cycle 2 ✅ — Firebase auth + per-user item CRUD + Firestore/Storage rules +
  36 tests. Reviewed by `code-reviewer` (safety invariant verified) and **merged to `main`**
  via PR #3 (squash). `main` @ `c5a476c`. (Cycles 0–2 + governance/charter all merged.)
- **Loop status:** ⏸️ STOPPED by the observer on 2026-06-13 after PR #3 merged. To resume,
  re-run `/loop` (it re-orients from this file + `git log`).
- **Active sprint:** none.
- **Next action (cycle 3):** the insurance-ready export — server `GET /api/export` (items via
  Admin SDK → printable HTML/PDF; a 501 stub + `verifyFirebaseToken` already exist) + a
  client "Export for insurance" action. This is DoD item #4 — the last core POC feature.
- **Carried follow-ups (do early in cycle 3):**
  - Dead code: delete `product/client/components/AddItemForm.vue` (+ its spec; unused —
    `AddItemModal.vue` is the shipped form); add a spec for `AddItemModal.vue`; drop the
    legacy `{formData, photoFile}` branch in `store/items.js` `addItem`.
  - Not-yet-run-live: do a manual/`verify` run (sign up → add camera → total → export)
    before declaring the POC done — current tests are unit-level with mocks.
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
Latest detail in `company/JOURNAL.md`. `main` @ `c5a476c`. Everything lives on `main`.
