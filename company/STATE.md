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
    #4 insurance export ✅ (cycle 3, PR #5) · #5 quality gate ✅ (rules **proven on emulator**
    — 15 rules tests pass; 74 unit tests; lint; merged). **All 5 POC DoD items MET (5/5).**
    Only remaining prudence step = a live browser E2E run (observer-owned; writes to their
    live Firebase) — not a numbered DoD criterion.
- **Last cycle:** Cycle 4 ✅ — hardening: made the emulator-gated Firestore rules suite
  actually run (fixed Jest+undici `ReadableStream` via server `jest.config.js`/`jest.setup.js`),
  15 rules tests pass; removed dead `AddItemForm` (PR #6); POC DoD check (all 5 met).
  Cycle 3 (insurance export, PR #5) merged `8fcdfcc`; cleanup (PR #6) merged `2ada691`.
- **Loop status:** ▶️ RUNNING — observer resumed `/loop` 2026-06-13. **POC DoD now met →
  per the loop stop conditions, the team stops & summarizes after the cycle-4 hardening PR
  merges.** Resume only on new observer direction.
- **Active sprint:** Cycle 4 hardening PR (rules-test infra + DoD check docs) — open/merging.
- **Next action:** open the cycle-4 PR (server `jest.config.js`/`jest.setup.js` + these doc
  updates), have `code-reviewer` merge, then STOP & summarize to the observer. The live
  browser E2E verify is the only open item and is the observer's call (manual run, or
  authorize a Playwright E2E that would create test data in the live project).
- **Carried follow-ups (post-POC, only on observer direction):**
  - Live browser E2E verify (sign up → add camera w/ photo → total → export) against the
    real project. Server↔live-Firestore already verified (admin read OK 2026-06-13).
  - Optional: payload-shape normalization refactor (cosmetic; see BACKLOG), client polish
    (validation/error states/responsive), rules test wired into CI.
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
