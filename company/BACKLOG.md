# Backlog

> Durable mirror of the team's task list (the live `~/.claude/tasks/` list is wiped at
> session end). The PM keeps this current. Items are small, independent, vertically sliced.
>
> Format: `- [ ] [role] <title> — <acceptance criteria>`  ·  blocked items: add `(blocked: …)`
> Roles: `frontend` · `backend` · `qa` · `design` · `pm`

## Now (post-cycle-5 — POC code-complete; remaining items are gated or polish)

Cycle 5 shipped (PR #11). Items below are the only open work. Most are **not** plain unblocked
build — read the gate tags. Run any real cycle as a **fresh Claude Team** (CLAUDE.md §1).

### Observer-gated / environment-blocked (cannot be self-served)

- [x] [ceo] **Run the comp seed against live Firebase** — DONE 2026-06-13 (observer-authorized). 575 comps live, parity-verified. Found+fixed a seed `modelKey` hard-coding bug (fix in PR #13).
- [x] [qa] **Seed↔runtime modelKey parity regression test** — DONE (PR #14): `__tests__/seedComps.spec.js` asserts every seed entry's key == `normalizeModelKey(make, model)`; pins the 5 originally-divergent models. Fails on any divergence.
- [~] [ceo] **Emulator proof of `comps`/items rules** — IN PROGRESS via CI (cycle 7, `chore/cycle7-ci`): GitHub Actions runs the rules suite under the emulator with Java. Closes the local "no Java" gap. Acceptance: the CI run is green on the PR.
- [ ] [observer] **Live browser E2E** — sign up → add camera (photo) → see computed estimate → deal check → log a sale → export. Observer-owned (writes user data). Comps are seeded, so estimates populate.

### Unblocked polish

- [x] [frontend] Drop the redundant `where('userId','==',uid)` in `store/items.js` `fetchItems` — DONE (PR #14).
- [x] [frontend] Client polish — add-item validation + inline errors + submit-guard — DONE (PR #14). (Responsive ≥768px sweep deferred — low value pre-validation.)
- [~] [ceo] Wire the emulator rules suite into CI — IN PROGRESS (cycle 7, `.github/workflows/ci.yml`).

## Later (POST-POC — do not start before DoD is met)

- [ ] Valuation history: timestamped value log per item + collection total over time.
- [ ] Automated sold-comp ingestion (live scraping or paid API feed, gated on eBay partner access).
- [ ] Real-time listing/deal alerts (requires a listing feed).
- [ ] Lightweight moderation and flagging of user-submitted comps.
- [ ] Watchlist: save a model for quick re-check; alert when a listing is under a target price.
- [ ] Category expansion beyond vintage cameras/lenses.
- [ ] Trading/marketplace + social features.
- [ ] Mobile native app.
- [ ] Payments/subscriptions.

## Done

- [x] [ceo] Phase 0 discovery + approved brief (cycle 0).
- [x] [fe/be] Scaffold product/client (Nuxt 2 SPA) + product/server (Express) (cycle 1).
- [x] [pm] Original POC Definition of Done + per-cycle targets in PRODUCT_BRIEF.md — **superseded by ADR-0006 pivot DoD** (cycle 2).
- [x] [design] Item data model + add-item flow spec in company/specs/item-schema.md (cycle 2).
- [x] [backend] Firestore + Storage security rules + FIRESTORE_MODEL.md (cycle 2).
- [x] [frontend] Firebase Auth (email/password) + route guard + auth store (cycle 2).
- [x] [frontend] Add-item form + gallery + total collection value (cycle 2).
- [x] [qa] Unit specs: auth + items stores + add-item (36 tests) (cycle 2).
- [x] [backend] Insurance export route scaffold + verifyFirebaseToken middleware (cycle 2).
- [x] [pm] jest.config.js: skip vue-jest style compilation to fix test suite (cycle 2).
- [x] [backend] Insurance export endpoint `GET /api/export` + `lib/exportTemplate.js` (XSS-safe printable HTML, per-user, 503 unconfigured) (cycle 3, PR #5).
- [x] [frontend] "Export for insurance" action (`items/exportInsurance`) + gallery button (cycle 3, PR #5).
- [x] [qa] Tests: export template + export route + export action + new `AddItemModal` spec (cycle 3, PR #5).
- [x] [ceo] Dead-code cleanup — delete unused `components/AddItemForm.vue` + `AddItemForm.spec.js` (cycle 4).
- [x] [ceo] Firestore rules emulator test — 15 rules tests pass on the emulator (cycle 4).
- [x] [ceo] Original POC DoD check — all 5 original DoD items verified met; **thesis then rejected by observer** as a CRUD/spreadsheet-replacement; pivot authorized (ADR-0006) (cycle 4).
- [x] [ceo] ADR-0006 — pivot decision recorded; observer steers locked (cycle 5 / Step 0).
- [x] [pm] Rewrite PRODUCT_BRIEF.md for the pivot + new DoD; rewrite BACKLOG.md; write comp-seed-plan spec; procurement note for eBay API (cycle 5 / Step 0).
- [x] [design] Reconcile item-schema + valuation-deal-ux specs to the client-write valuation path; defer Watchlist post-POC (cycle 5 / Step 0, PR #10).
- [x] [backend] `lib/valuation.js` engine + `GET /api/valuation` + `POST /api/deal-check` + `scripts/seedComps.js` (575 docs) + `comps` rules + comp-backed `exportTemplate.js` + items-path migration fix in `routes/export.js` (cycle 5, PR #11).
- [x] [frontend] Computed values in `store/items.js`/`ItemCard`/`index.vue`; `store/dealCheck.js`; `store/comps.js` logSale; `ValuationBadge`/`LogSaleModal`/`deal-check.vue`; manual-value field removed; Refresh estimate (cycle 5, PR #11).
- [x] [qa] valuation engine (36) + valuation route (15) + deal-check route (20) tests; `comps` emulator rules tests; migrated items specs to subcollection path (cycle 5, PR #11).
- [x] [ceo] Run cycle 5 as a real Claude Team (`vault-cycle5`: be/fe/qa/reviewer, peer-DM collaboration); integrate + open PR #11; reviewer merged `f95ae0a` (cycle 5).
