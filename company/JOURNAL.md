# Journal (per-cycle standup)

> Newest entry at top. One short entry per cycle: what shipped, decisions, blockers, next.

## Cycle 7 — CI; POC complete at DoD 6/6 (2026-06-13)
- Added `.github/workflows/ci.yml` (PR #15, merged `f4f41e1`): Node 20 + Temurin **Java 21**;
  lint + tests both packages + the Firestore **rules suite under the emulator** (`firebase-tools
  emulators:exec`), mirroring cycle 4's local invocation. **Closed the DoD #6 gap** — the rules
  proof was blocked locally by no Java. CI run went green with **120/120, 0 skipped** (vs. 29
  skipped locally), proving the rules suite executed under the emulator. (First run failed on
  Java 17 — firebase-tools now needs JDK 21+; bumped and re-ran green.) Single-role infra →
  authored solo + reviewer-merged (not a full team, per CLAUDE.md §1).
- **Pivot POC is COMPLETE — DoD 6/6.** Autonomous build stopped here: every DoD item is met,
  live comps are seeded, CI gates every PR. The remaining steps (live browser E2E, real-collector
  validation) are observer-owned; post-POC features stay deferred until the thesis validates with
  real collectors. Continuing to build now would be gold-plating an unvalidated thesis.

## Cycle 6 — Harden + polish (2026-06-13)
- Ran as team `vault-cycle6` (be/fe/qa/reviewer, peer collaboration). Shipped (PR #14):
  **seed↔runtime modelKey parity regression test** (`__tests__/seedComps.spec.js`) that fails if
  any seed entry's key diverges from `normalizeModelKey` — locks out the bug class found during the
  seed run; **client polish** (AddItemModal validation/inline-errors/submit-guard; failed valuation
  still saves `estimatedValue:null`); dropped the redundant `fetchItems` `where` filter. `be` made
  `seedComps.js` test-importable (guarded `main`, exported `MODELS`/`buildComps`). Gates: server 91 /
  29 emulator-skipped, client 81, lint clean.

## Seed run — live comps populated + seed-key parity bug fixed (2026-06-13)
- **Observer authorized a live write** ("you should have the service account in the .env… see if
  you can accomplish this seed task"). Ran `scripts/seedComps.js` against `agent-teams-experiment`:
  575 comps written. (Sandbox blocked gRPC to `firestore.googleapis.com`; ran with the sandbox
  dropped for the live-write command only.)
- **Verification caught a real bug** (the reason to verify, not just declare done): the seed
  HARD-CODED each `modelKey`, and ~14/23 were hand-written inconsistently with the shared
  `normalizeModelKey(make,model)` — e.g. seeded `hasselblad-500cm` but the app computes
  `hasselblad-500c-m`, so a user adding most lenses + several bodies got "no data" despite 25
  seeded comps existing. QA's unit tests injected comps directly, so they never exercised
  seed-key↔runtime-key parity.
- **Fix:** derive `modelKey` from `normalizeModelKey` in the seed script (single source of truth);
  re-seeded; re-verified — 575 docs, 23 keys × 25, **0 parity mismatches**, all previously-broken
  models now value (Hasselblad 500C/M Mint $2,052; Summicron 50/2 Exc $1,352; etc.). Fix → PR #13.
- **Follow-up filed:** QA regression test asserting seed/runtime key parity (BACKLOG).

## Cycle 5 — PIVOT executed: market-aware collection (2026-06-13)
- **The pivot.** Observer rejected the shipped POC as a CRUD/spreadsheet-replacement ("data
  entry is not a solution"). Reframed the product (ADR-0006) from a collection *ledger* to a
  **market-aware collection**: comp-backed *living valuation* + a *"good buy?" deal check*,
  riding a **crowd-sourced sales dataset** (the moat). Insurance export demoted to a byproduct.
  The real problem = information asymmetry, not data entry. Our own discovery had named
  CardLadder/Discogs as comparables and we'd copied the commodity half (the list), not the moat
  (the intelligence). Observer steers: BOTH valuation+deal; crowd-sourced comps (eBay sold-comp
  API is partner-gated). Step 0 docs merged as **PR #10**.
- **Shipped (PR #11 @ `f95ae0a`).** `lib/valuation.js` (condition multipliers, 24-mo recency,
  median + 20/80 range, insufficient-sample path); `GET /api/valuation` + `POST /api/deal-check`;
  `comps` rules + `scripts/seedComps.js` (575 seed docs); client computed values, deal-check
  page, log-a-sale crowd loop, Refresh estimate, comp-backed gallery total; export comp evidence.
  **Found & fixed an integration bug:** the substrate stored items in a top-level `items`
  collection — migrated client + server `export.js` + `firestore.rules` to `users/{uid}/items`.
- **Team mode (observer directive).** Ran cycle 5 as a real Claude Team (`vault-cycle5`:
  be/fe/qa/reviewer) with **peer-to-peer collaboration** — fe↔be reconciled the API contract and
  `normalizeModelKey` directly, qa coordinated specs with be, reviewer merged. Codified as
  mandatory in CLAUDE.md §1. Worked notably better than the prior hub-and-spoke.
- **DoD: 5.5 / 6.** Items 1–5 fully met; #6 met except the **emulator proof** of the rules —
  tests are written and the default suite is green (server 81 / client 72, lint clean), but the
  emulator run is **blocked by no local Java/JRE** this environment. Reviewer accepted as
  non-blocking.
- **Next / blockers.** POC is code-complete. Remaining is observer-gated (run the comp seed
  against live Firebase — required to make valuations populate; live E2E) or env-blocked
  (emulator proof needs Java). Defensible to STOP here; or cycle 6 = client polish.

## Cycle 4 — Hardening: rules test proven + POC DoD check (2026-06-13)
- **Firestore rules now actually verified.** The emulator-gated rules suite was skipping in
  every prior cycle (no emulator). Stood up the Firebase emulator via `npx firebase-tools
  emulators:exec --only firestore --project demo-vault 'npm --prefix product/server test'`
  and the **15 rules tests pass** (cross-user create/read/update/delete deny + owner-allow).
  Root-caused a Jest+undici failure (`ReadableStream is not defined`) and fixed it with a
  server `jest.config.js` + `jest.setup.js` polyfilling web globals (only when missing, so
  the unit suites are untouched); consolidated the duplicate `package.json` jest key. Default
  `npm test` still auto-skips rules without the emulator (CI-safe).
- **Cleanup (PR #6):** removed the genuinely-dead `AddItemForm.vue` + spec; corrected the
  stale "drop legacy addItem branch" assumption (that branch is the LIVE path).
- **POC Definition of Done — status check:**
  | # | DoD item | Status |
  |---|---|---|
  | 1 | Auth (email/pw) + route guard | ✅ built+merged (c2), unit-tested |
  | 2 | Add item (fields + photo) per-user | ✅ built+merged (c2), unit-tested |
  | 3 | Gallery + total value | ✅ built+merged (c2), unit-tested |
  | 4 | Insurance export end-to-end | ✅ built+merged (c3, PR #5); each layer unit-tested |
  | 5 | Quality gate (per-user rules deny, tests, lint, merged) | ✅ rules **proven on emulator** (15 pass); 74 unit tests (54 client + 20 server); lint clean; all merged |
  - **All 5 DoD items met.** Remaining prudence step (not a numbered DoD criterion): a live,
    browser-driven E2E run (real sign-up → add a camera w/ photo → export) against the live
    Firebase project — handed to the observer (it writes real data to their project). The
    server↔live-Firestore connection itself was verified 2026-06-13 (admin read OK).

## Cycle 3 — Insurance export (DoD #4) merged (2026-06-13)
- Observer resumed the loop ("back to iterating"). CEO ran cycle 3 with a 3-engineer team:
  backend (`GET /api/export` real impl + `lib/exportTemplate.js`, XSS-safe printable HTML),
  frontend (`items/exportInsurance` action + gallery button), qa (export template/route +
  export action tests + a new `AddItemModal` spec). Reviewed + squash-merged by the
  independent `code-reviewer` as **PR #5** → `main` @ `8fcdfcc`.
- CEO integration catch: export template read `item.serialNumber`; canonical field is `serial`
  (schema/form/store) — fixed inline + a regression test added. Gate green: lint clean both
  packages, server 20 pass (+15 emulator-skipped), client 60 pass.
- **Scope call:** deferred the dead-code/legacy-`addItem`-branch cleanup to cycle 4 — it's
  coupled to `items.spec.js` and bundling it risked mid-cycle gate races. DoD #4 shipped clean.
- All 5 core POC features now built + merged (~4.8/5). Remaining for true sign-off: run the
  emulator-gated rules test for real + a live end-to-end verify. Next: cycle 4 hardening.

## Cycle 2 merged + loop stopped (2026-06-13)
- Cycle 2 (Firebase auth + per-user item CRUD + Firestore/Storage rules + 36 tests) reviewed
  by the independent reviewer (safety invariant verified: no secret client-exposed; rules
  deny cross-user) and squash-merged to `main` via **PR #3** (`c5a476c`).
- Two process bugs fixed in-cycle: the idle-hook no longer force-loops; the TaskCompleted
  gate now scopes to changed packages only. Stale PROCUREMENT/STATE that wrongly implied
  "blocked on Firebase" corrected (creds verified live).
- Checkpoint cleanup (this PR): corrected STATE/BACKLOG to reflect the merge + loop stop;
  scoped the git-guard bare-host check to real `git` invocations (it had tripped on any text
  merely mentioning the host). Carried follow-ups recorded for cycle 3.
- **Observer stopped the loop after PR #3.** POC ≈ 3.5/5 — remaining: insurance export
  (DoD #4), an `AddItemModal` test + dead-code removal, and a live verify run. Resume = `/loop`.

## PR #1 reviewed + merged — autonomous flow live (2026-06-12)
- Independent reviewer ran the genesis review (secrets clean, both packages lint green,
  conventions/boot verified) and **squash-merged PR #1 to `main`** (`0b920a1`). The
  human-as-observer + reviewer-merges model is now operating end to end.
- Finding: single GitHub account can't self-approve PRs (`gh pr review --approve` blocked
  on own PRs). Reviewer worked around via comment + squash-merge; recorded as ADR-0004.
- `gh pr review --approve` requires a 2nd identity, so branch-protection-with-required-review
  isn't viable on one account — surfaced to the observer for a decision.

## Charter update — autonomous governance (2026-06-12)
- Owner set the model: **human is an observer**; the CEO + team own the full loop including
  code review and merge. Added a new **`code-reviewer`** agent = independent reviewer + sole
  merge authority (`gh pr merge --squash --delete-branch`); CEO/engineers never merge.
- Dropped the human product-approval gate (CEO owns direction). Only human touchpoint =
  procurement. Updated CLAUDE.md (§1–3, §7, §8), WORKING_AGREEMENTS, DECISIONS (ADR-0003),
  and added `.claude/agents/code-reviewer.md`.
- Next: have `code-reviewer` review + merge PR #1 to put the new model on `main`.

## Cycle 1 — Scaffold (2026-06-12)
- Spawned team `vault` with `fe` (frontend-engineer) + `be` (backend-engineer), parallel,
  separate dir ownership.
- `fe` scaffolded `product/client` (Nuxt 2 SPA: nuxt.config, firebase modular plugin,
  lib/{http,logger,utils,constants}, store, layout, landing, spinner). Lint clean.
- `be` scaffolded `product/server` (Express 4 CommonJS: index, guarded firebase-admin,
  logger, auth middleware, health route). Lint clean; boots without creds.
- CEO verified both lints + server boot, committed `fd2615e`. Team stood down.
- Mid-cycle: loosened non-destructive in-repo shell commands (npm install/lint auto-run;
  rm/chmod still prompt) + sanctioned `~/.npm` cache — commit `d177523`.
- Tiny follow-up noted: server logger should store the uuid as an `id` field on the doc (§6).
- Next: cycle 2 (auth + item CRUD), blocked on Firebase procurement.

## Cycle 0 — Phase 0 discovery (2026-06-12)
- Ran 7 web searches into underserved, software-solvable market gaps fitting a
  Nuxt2/Express/Firestore product.
- Eliminated false gaps (already served): small-nonprofit volunteer/donation tooling;
  small food-business HACCP logging. Deprioritized crowded horizontal solo-service CRM.
- Selected a real underserved gap: **collection management with insurance documentation +
  valuation history** for passionate niche collectors; recommended beachhead = vintage
  cameras/lenses (category-extensible data model).
- Wrote `company/PRODUCT_BRIEF.md` (`Approval: PENDING`), logged Firebase procurement.
- **HALTED at the approval gate.** Awaiting human review of the brief + 2 open questions.

## Bootstrap
- Scaffolded the company: `CLAUDE.md`, `.claude/` (settings + hooks + agent roles),
  `company/` memory docs, `.env.example`, `.gitignore`, stack templates.
- Phase 0. Next: CEO runs discovery → writes `PRODUCT_BRIEF.md` → halts for approval.
