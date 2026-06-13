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
    #4 insurance export ✅ (cycle 3, PR #5) · #5 quality gate ✅ (rules + 80 tests + lint +
    merged). **All 5 core DoD features built + merged ≈ 4.8 / 5** — remaining for a true POC
    sign-off: run the emulator-gated rules test for real, and a live end-to-end verify run.
- **Last cycle:** Cycle 3 ✅ — insurance-ready export (DoD #4): server `GET /api/export`
  (Admin SDK → XSS-safe printable HTML inventory; 503 when unconfigured) + `lib/exportTemplate.js`,
  client `items/exportInsurance` action + gallery button, +27 tests (export template/route,
  export action, new `AddItemModal` spec). Reviewed by `code-reviewer` (security invariants:
  auth-guarded, per-user isolation, XSS escaping verified) and **merged to `main`** via PR #5
  (squash). `main` @ `8fcdfcc`. (Cycles 0–3 + governance/charter all merged.)
- **Loop status:** ▶️ RUNNING — observer resumed `/loop` 2026-06-13 ("back to iterating").
- **Active sprint:** Cycle 4 — hardening + POC DoD gate (see BACKLOG "Now").
- **Next action (cycle 4):** (a) deferred cleanup — delete dead `AddItemForm.vue` (+ spec),
  drop the legacy `{formData, photoFile}` `addItem` branch, migrate its specs; (b) actually
  run the emulator-gated Firestore rules test (needs the Firebase emulator); (c) live verify
  run (sign up → add camera → total → export against real Firebase); (d) POC DoD check + summary.
- **Carried follow-ups:**
  - Cleanup is now cycle-4 work (was deferred out of cycle 3 to avoid spec/gate coupling).
  - Live verify + emulator run may hit environment needs (Firebase emulator / a browser for
    the full sign-up flow) — file procurement if blocked rather than faking it.
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
