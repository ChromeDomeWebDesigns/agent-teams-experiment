# Journal (per-cycle standup)

> Newest entry at top. One short entry per cycle: what shipped, decisions, blockers, next.

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
