# Company State

> Read this first every cycle. It is the resume point. Keep it short and current.

- **Phase:** 1 — **Build (pivot). Cycle 5 MERGED.** Pivot POC is **code-complete** on `main`
  @ `f95ae0a` (PR #11). Direction docs were PR #10 @ `2001e14`.
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
- **Loop status:** ✅ Step 0 (repositioning) merged (PR #10). ✅ Cycle 5 (valuation engine +
  deal check + crowd loop + items-path migration) **merged** (PR #11 @ `f95ae0a`). The pivot
  POC's **buildable scope is essentially complete**.
- **What shipped in cycle 5:** `lib/valuation.js` (multipliers Mint 1.35/Exc 1.15/Good 1.0/Fair
  0.80/Poor 0.60; 24-mo recency; median+20/80; insufficient-sample path); `GET /api/valuation` +
  `POST /api/deal-check`; `comps` rules; `scripts/seedComps.js` (575 seed docs); client computed
  values, deal-check page, log-a-sale, Refresh estimate, comp-backed total; export comp evidence.
  Items migrated top-level→`users/{uid}/items` across client/server/rules; client/server
  `normalizeModelKey` byte-identical.
- **Remaining work (mostly observer-gated or environment-blocked — NOT plain unblocked build):**
  1. 🔴 **Run the comp seed** (`node product/server/scripts/seedComps.js`) against live Firebase
     — REQUIRED for the product to actually return estimates (un-seeded → everything is "no
     data"). Writes reference data to the observer's live project; needs `FIREBASE_SERVICE_ACCOUNT_PATH`.
     Treat as observer-gated (like live E2E) unless the company is cleared to write live.
  2. 🔴 **Emulator proof of rules** — needs a Java/JRE-equipped env (or CI). Tests are written.
  3. 🔵 **Live browser E2E** (sign up → add camera → see computed estimate → deal check → log
     sale → export) — observer-owned (writes user data).
  4. 🟢 **Unblocked polish (candidate cycle 6):** drop the redundant `where('userId','==',uid)`
     in `fetchItems` (reviewer flagged, cosmetic); client validation/error-states/responsive;
     wire the emulator rules suite into CI.
- **Next action:** decide with observer whether to (a) STOP — POC code-complete, hand the
  seed-run + live E2E to the observer; or (b) run **cycle 6** (team mode) on the 🟢 polish items.
  Per loop stop conditions, (a) is defensible now. Awaiting observer steer / next `/loop` tick.
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
