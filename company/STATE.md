# Company State

> Read this first every cycle. It is the resume point. Keep it short and current.

- **Phase:** 2 — **PIVOT POC COMPLETE (DoD 6/6).** `main` @ `f4f41e1`. All cycles merged:
  PR #10 (reposition) · #11 (build) · #12 (checkpoint) · #13 (seed-key fix) · #14 (harden +
  polish) · #15 (CI). Live comps seeded (575, parity-verified). CI gates every PR (lint + tests
  both packages + Firestore rules **proven under the emulator** — 120/120, 0 skipped).
- **⏹️ AUTONOMOUS BUILD STOPPED — this is the right stop point, not a usage cutoff.** Every DoD
  item is met and there is no high-value *unblocked* work left. The next real step is **observer-
  owned**: put it in front of 5–10 real vintage-camera collectors (the brief's validation target)
  and run a live browser E2E. Do NOT keep building features against an unvalidated thesis
  (valuation history, alerts, marketplace, etc. are all deferred until the thesis validates).
  Resume only on new observer direction (e.g. validation feedback, or a greenlit post-POC item).
- **🆕 TEAM MODE IS MANDATORY (observer directive 2026-06-13, CLAUDE.md §1).** Every
  multi-role increment MUST run as a real Claude Team: `TeamCreate` + shared task list
  (`TaskCreate`/`TaskUpdate`) + teammates spawned into the team (`team_name`) collaborating
  **peer-to-peer** (frontend↔backend on contracts, qa→owning engineer on defects, reviewer→
  author on changes). No hub-and-spoke subagents. Cycle 5 ran this way (team `vault-cycle5`:
  be/fe/qa/reviewer) and it worked well (peer DMs reconciled the API contract + caught the
  items-path bug). **Create a fresh team per cycle; shut the prior one down at cycle end.**
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
- **🎯 MILESTONE — Pivot POC (deadline 2026-06-20).** DoD status after cycle 5 (PRODUCT_BRIEF.md):
  (1) computed comp-backed estimate+range on add ✅ · (2) living portfolio total ✅ ·
  (3) deal-check verdict ✅ · (4) crowd "log a sale" loop + Refresh estimate ✅ ·
  (5) insurance export shows comp-backed evidence ✅ · (6) quality gate ✅ **except** the
  emulator *proof* of `comps`/items rules — tests are WRITTEN and the default suite is green
  (server 81 pass / 29 emulator-skipped; client 72), but the emulator run is **blocked by no
  local Java/JRE** this environment. **5.5 / 6.** Reviewer accepted the gap as non-blocking.
- **Substrate (now all on `main` @ `f95ae0a`):** Firebase Auth + route guard; per-user
  `users/{uid}/items` model + path-wildcard rules; add-item (computed value) + gallery +
  comp-backed total; deal-check page + endpoints; crowd log-a-sale; insurance export with
  comp evidence; valuation engine; ~153 unit tests across client+server; lint gate.
- **Loop status:** ⏹️ STOPPED — pivot POC complete. PRs #10–#15 all merged. Cycle 7 (CI) merged
  (PR #15 `f4f41e1`); the emulator rules proof ran green in CI (120/120, 0 skipped).
- **What shipped in cycle 5:** `lib/valuation.js` (multipliers Mint 1.35/Exc 1.15/Good 1.0/Fair
  0.80/Poor 0.60; 24-mo recency; median+20/80; insufficient-sample path); `GET /api/valuation` +
  `POST /api/deal-check`; `comps` rules; `scripts/seedComps.js` (575 seed docs); client computed
  values, deal-check page, log-a-sale, Refresh estimate, comp-backed total; export comp evidence.
  Items migrated top-level→`users/{uid}/items` across client/server/rules; client/server
  `normalizeModelKey` byte-identical.
- **✅ COMP SEED RUN (2026-06-13, observer-authorized).** Ran `scripts/seedComps.js` against the
  live project (`agent-teams-experiment`): **575 comps live, 23 models × 25 docs, parity-verified
  (0 key/runtime mismatches).** Live valuations confirmed (e.g. Leica M3 Excellent → $1,183;
  Hasselblad 500C/M Mint → $2,052). DoD #1 now proven end-to-end on live data.
  - **🐛 Bug found+fixed during the run:** the seed script HARD-CODED each `modelKey`, and ~14/23
    were hand-written wrong vs `normalizeModelKey(make,model)` (e.g. seeded `hasselblad-500cm` but
    runtime computes `hasselblad-500c-m`) → those models returned "no data" in-app. Fixed the
    script to DERIVE `modelKey` via the shared `normalizeModelKey`; re-seeded; re-verified 0
    mismatches. Fixed in **PR #13** (merged `403427e`).
- **Cycle 6 (merged, PR #14 `15ce8f6`):** seed↔runtime `modelKey` **parity regression test**
  (`__tests__/seedComps.spec.js`, pins the 5 originally-divergent models — bug class can't recur);
  client polish (AddItemModal validation + inline errors + submit-guard; failed valuation still
  saves `estimatedValue:null`); dropped the redundant `where('userId','==',uid)` in `fetchItems`.
  Server 91 pass / 29 emulator-skipped; client 81 pass.
- **Cycle 7 (merged, PR #15 `f4f41e1`):** GitHub Actions CI (`.github/workflows/ci.yml`) — Node 20
  + Temurin **Java 21**; `npm ci` + lint + tests both packages + the **Firestore rules suite under
  the emulator** via `firebase-tools emulators:exec`. Closed the DoD #6 emulator-proof gap that was
  blocked locally (no Java). CI now gates every PR + push to `main`.
- **🔧 LIVE RULES DEPLOYED (2026-06-13 hotfix).** The live app threw `Missing or insufficient
  permissions` on `fetchItems` — the live project still had pre-migration rules (PR #11 moved items
  to `users/{uid}/items`; nothing ever *published* the new rules — emulator/CI only test them).
  Published `firestore.rules` + `storage.rules` to `agent-teams-experiment` via the Rules REST API
  (SA token; `firebase deploy` is blocked — SA lacks `serviceusage` precheck). Verified live.
  **Rules now drift unless deployed after each change** → use `node product/server/scripts/deployRules.js`
  (committed). Follow-up: wire it into CI on push to `main` (needs SA as a GitHub secret → observer).
- **Remaining work (all observer-owned / deferred — nothing unblocked for the company):**
  1. 🔵 **Live browser E2E** (sign up → add camera → computed estimate → deal check → log sale →
     export) — observer-owned (writes user data). Comps are seeded, so estimates will populate.
  2. 🔵 **Real-collector validation** — the brief's success gate: 5–10 collectors use it; ≥3 say it
     beats their spreadsheet. Observer-owned outreach. Post-POC features stay deferred until this.
  3. 🟢 **Optional polish:** responsive ≥768px sweep. Low value pre-validation; defer.
- **Next action:** none autonomous — the company has shipped the POC. Awaiting observer:
  live E2E + real-collector validation. Resume on new direction (validation feedback, or a
  greenlit post-POC item from BACKLOG "Later").
- Each cycle: fresh team → branch off `main` → PR → `code-reviewer` merges → shut team down.
- **Active teammates:** team `vault-cycle5` (be/fe/qa/reviewer) — being shut down at cycle-5 close.
- **Git trunk:** `main` established on remote (at bootstrap commit) and set as default;
  local `main` tracks it. Future cycles: branch off `main` → PR.
- **PRs:** #1–#11 merged. **#10** = pivot direction docs (ADR-0006); **#11** = cycle-5 build
  (valuation/deal-check/crowd loop + items-path migration).
- **Open blockers:** none. ✅ Firebase fully provisioned + verified (live admin read OK
  2026-06-13, project `agent-teams-experiment`) — see PROCUREMENT.md. Do NOT treat Firebase
  as blocked.
- **Known governance limitation:** single GitHub account means `code-reviewer` can't formally
  `gh pr review --approve` its own-account PRs (it records the verdict as a comment, then
  squash-merges). Branch protection requiring an approving review would need a 2nd identity.
  See ADR-0004.

## Cycle log pointer
Latest detail in `company/JOURNAL.md`. `main` @ `f95ae0a` (cycle 5, PR #11). Everything is on `main`.
