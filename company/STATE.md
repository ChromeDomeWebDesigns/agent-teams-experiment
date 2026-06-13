# Company State

> Read this first every cycle. It is the resume point. Keep it short and current.

- **Phase:** 1 — **Build (pivot), cycle 5 in progress.** Pivot direction docs MERGED to `main`
  (PR #10 @ `2001e14`); cycle-5 feature code is WIP on a branch (see below).
- **⛔ STOPPED at usage limit 2026-06-13.** Resume point is precise below. Nothing is lost —
  WIP is committed to the `feat/valuation-deal-check` branch.
- **🆕 TEAM MODE IS NOW MANDATORY (observer directive 2026-06-13, CLAUDE.md §1).** Every
  multi-role increment MUST run as a real Claude Team: `TeamCreate` + shared task list
  (`TaskCreate`/`TaskUpdate`) + teammates spawned into the team (`team_name`) collaborating
  **peer-to-peer** (frontend↔backend on contracts, qa→owning engineer on defects, reviewer→
  author on changes). No more isolated hub-and-spoke subagents. Team `vault-cycle5` already
  created (`~/.claude/teams/vault-cycle5/config.json`) but no members spawned yet (stopped
  before the QA wave to conserve usage).
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
- **Loop status:** ⏸️ PAUSED at usage limit. ✅ Step 0 (repositioning) DONE & merged (PR #10).
  ⏳ Cycle 5 build wave-1 (backend + frontend) DONE on branch, WIP-committed, NOT merged.
- **Cycle-5 progress:**
  - ✅ **Backend** (`feat/valuation-deal-check`): `lib/valuation.js` (pure engine — multipliers
    Mint 1.35 / Exc 1.15 / Good 1.0 / Fair 0.80 / Poor 0.60; 24-mo recency; median + 20/80
    range; min sample 3), `routes/valuation.js` (`GET /api/valuation`), `routes/dealCheck.js`
    (`POST /api/deal-check`, verdict under/at/over/null), mounted in `index.js`; `exportTemplate.js`
    now comp-backed + evidence line; `scripts/seedComps.js` (575 seed docs, 23 models × 5
    conditions × 5; deterministic IDs; **NOT yet run** — needs live creds: `node
    product/server/scripts/seedComps.js`); `firestore.rules` adds `comps` (authed read; authed
    create own `user-submitted`; seed/verified Admin-only). Server lint + 20 existing tests green.
  - ✅ **Frontend** (`feat/valuation-deal-check`): `normalizeModelKey` in `lib/utils.js`;
    `store/items.js` (valuationPreview + fetchValuation + refreshEstimate + totalValue by
    effective value; writes `estimatedValue`+`modelKey`); `store/dealCheck.js`; `store/comps.js`
    (`logSale` client-side web-SDK write); `components/ValuationBadge.vue`, `LogSaleModal.vue`;
    `AddItemModal.vue` (manual value field REMOVED, debounced valuation preview); `ItemCard.vue`
    (badge + Refresh estimate button); `pages/deal-check.vue`; `pages/index.vue` (comp-backed
    total + nav, NO watchlist). Client lint + 72 tests green.
- **⚠️ OPEN INTEGRATION RISK (verify next session):** the frontend changed the items Firestore
  path to the per-user subcollection `users/{uid}/items` (it reports the OLD client used a
  top-level `items` collection). Confirm the **server export route** (`routes/export.js`) and
  `firestore.rules` read/enforce the SAME `users/{uid}/items` path, and that the existing
  cycle-3 export tests still reflect reality. The proven rules already target `users/{uid}/items`,
  so the new path is likely the correct alignment — but **QA + the owning engineers must confirm
  end-to-end** before merge. Also verify client/server `normalizeModelKey` produce identical keys.
- **Next action (resume here):** run cycle-5 **as a team** (`vault-cycle5`): (1) spawn
  `qa-engineer` into the team → valuation-engine unit tests, deal-check endpoint tests, `comps`
  emulator rules tests, + the integration verification above; let QA DM `be`/`fe` directly for
  fixes. (2) CEO integrates, runs full lint+test on both packages. (3) push branch, open PR,
  spawn `code-reviewer` into the team to review + squash-merge. (4) checkpoint. NOTE: CLAUDE.md
  directive change (mandatory team mode) is included in the WIP commit — reviewer should keep it.
- Each cycle: branch off `main` → PR → `code-reviewer` merges.
- Each cycle: branch off `main` → PR → `code-reviewer` merges.
- **Active teammates:** none running (cycle-5 wave-1 engineers `be-cycle5`/`fe-cycle5` finished
  & idle; their work is on disk). Team `vault-cycle5` exists with no spawned members yet.
- **Git trunk:** `main` established on remote (at bootstrap commit) and set as default;
  local `main` tracks it. Future cycles: branch off `main` → PR.
- **PRs:** #1–#10 merged. **#10** = pivot direction docs (ADR-0006). Cycle-5 feature PR not yet
  opened (branch `feat/valuation-deal-check` is WIP-committed, not pushed). Open it next session
  after QA + integration verify.
- **Open blockers:** none. ✅ Firebase fully provisioned + verified (live admin read OK
  2026-06-13, project `agent-teams-experiment`) — see PROCUREMENT.md. Do NOT treat Firebase
  as blocked.
- **Known governance limitation:** single GitHub account means `code-reviewer` can't formally
  `gh pr review --approve` its own-account PRs (it records the verdict as a comment, then
  squash-merges). Branch protection requiring an approving review would need a 2nd identity.
  See ADR-0004.

## Cycle log pointer
Latest detail in `company/JOURNAL.md`. `main` @ `2001e14` (pivot docs, PR #10). Cycle-5 feature
WIP lives on branch `feat/valuation-deal-check` (not merged).
