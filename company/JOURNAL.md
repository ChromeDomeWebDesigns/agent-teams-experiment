# Journal (per-cycle standup)

> Newest entry at top. One short entry per cycle: what shipped, decisions, blockers, next.

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
