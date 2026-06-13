# Backlog

> Durable mirror of the team's task list (the live `~/.claude/tasks/` list is wiped at
> session end). The PM keeps this current. Items are small, independent, vertically sliced.
>
> Format: `- [ ] [role] <title> — <acceptance criteria>`  ·  blocked items: add `(blocked: …)`
> Roles: `frontend` · `backend` · `qa` · `design` · `pm`

## Now (cycle 5 — pivot build: valuation engine + deal check + crowd loop)

All items are unblocked. File ownership is strict: backend owns `product/server/**`; frontend
owns `product/client/**`; qa owns `**/*.spec.js` and `__tests__/**`. No two teammates edit the
same file.

### Backend

- [ ] [backend] `lib/valuation.js` — pure valuation engine: accepts `{ make, model, condition, comps[] }`, matches on `modelKey` within a configurable recency window, applies condition multipliers (Mint/Excellent/Good/Fair/Poor), returns `{ estimate, low, high, sampleSize, asOf }`. Returns `{ estimate: null, sampleSize: 0 }` when data is insufficient. No Firestore dependency (injected comp set). Acceptance: function exported from `product/server/lib/valuation.js`; passes QA unit tests.

- [ ] [backend] `comps` Firestore model + seed script — add `comps` collection shape to `product/server/FIRESTORE_MODEL.md`; write `product/server/scripts/seedComps.js` that writes ~100–200 hand-curated comp docs (top vintage camera/lens models, all condition tiers) via the Admin SDK. Acceptance: running `node product/server/scripts/seedComps.js` against the live project populates `comps` without error; seed docs have shape `{ make, model, modelKey, condition, salePrice, saleDate, source, contributedBy: 'seed', status: 'seed', createdAt }`.

- [ ] [backend] Valuation and deal-check endpoints — `GET /api/valuation?make=&model=&condition=` returns `{ estimate, low, high, sampleSize, asOf }` from the engine over Firestore comps; `POST /api/deal-check` accepts `{ make, model, condition, askingPrice }` returns `{ verdict: 'under'|'at'|'over', estimate, low, high, sampleSize }`. Both behind `verifyFirebaseToken`. Mounted in `product/server/index.js`. Acceptance: endpoint returns a numeric estimate for a seeded model; returns `{ estimate: null }` for unknown model; unauthenticated request returns 401.

- [ ] [backend] Updated `lib/exportTemplate.js` — each line item in the export shows `estimatedValue`, `valueLow`, `valueHigh`, and a "based on N recent sales" evidence note rather than relying on `currentValue`. Acceptance: export output for an item with a seeded comp renders a numeric estimate and a non-zero N in the printable document.

- [ ] [backend] `firestore.rules` — add `comps` rules: authenticated read allowed; authenticated create allowed only when `request.resource.data.contributedBy == request.auth.uid` and `request.resource.data.status == 'user-submitted'`; `seed`/`verified` status writes blocked for clients. Acceptance: new emulator tests (QA-owned) for these rules pass.

### Frontend

- [ ] [frontend] Computed value in `store/items.js` — `addItem` action calls `GET /api/valuation` after saving the item and stores `{ estimatedValue, valueLow, valueHigh, sampleSize }` on the item document. `items` state shape adds these fields. `totalValue` getter sums `estimatedValue` (falling back to `userOverrideValue` if present). Acceptance: adding an item triggers a valuation call; `totalValue` reflects estimates.

- [ ] [frontend] `components/ItemCard.vue` + `pages/index.vue` — gallery displays per-item estimated value with range and "based on N sales" label. Collection total uses computed estimates. Remove the display of any manually typed `currentValue` field. Acceptance: gallery shows estimate + range + N for each item; total is the sum of estimates; no raw `currentValue` shown.

- [ ] [frontend] `pages/deal-check.vue` — new page (nav-linked): form accepts make/model/condition/asking price; on submit calls `POST /api/deal-check`; displays verdict badge (under/at/over market), the comp range, and the sample count. Shows a "limited data" message when `sampleSize` is below threshold. Acceptance: submitting a seeded model at an inflated price shows "over market"; submitting an unknown model shows "limited data."

- [ ] [frontend] "Log a sale" action + form — `store/comps.js` Vuex module with a `logSale` action that `POST`s to a new `POST /api/comps` endpoint (backend to add); a small `components/LogSaleModal.vue` (or inline form) lets the user enter make/model/condition/salePrice/saleDate. Acceptance: authenticated user submits the form; a doc appears in `comps` with `contributedBy = uid` and `status = 'user-submitted'`; the store does not throw. (blocked: `POST /api/comps` endpoint must be added by backend alongside the valuation endpoint)

- [ ] [frontend] Remove manual-value field from `components/AddItemModal.vue` — drop the `currentValue` / "current value" input; the add-item form collects only make, model, serial, condition, purchase price, purchase date, notes, and photo. Value is computed after save. Acceptance: add-item form renders without a "current value" field; existing form validation tests updated to match.

### QA

- [ ] [qa] Valuation engine unit tests (`product/server/lib/valuation.spec.js`) — covers: correct median estimate for a known comp set; condition-multiplier application (Mint > Excellent > Good); "insufficient data" path when sampleSize < threshold; edge case with a single comp. Acceptance: all tests pass with `npm test` on the server.

- [ ] [qa] Deal-check endpoint tests (`product/server/routes/deal-check.spec.js` or inline) — covers: "over market" verdict for an inflated asking price; "under market" verdict for a low asking price; "at market" verdict within the range; 401 on unauthenticated request. Acceptance: tests pass.

- [ ] [qa] `comps` Firestore rules emulator tests — add to the existing emulator suite: authed user can read a `comps` doc; authed user can create a `user-submitted` comp where `contributedBy == uid`; authed user cannot create a `seed` or `verified` comp; unauthenticated user cannot read or write. Acceptance: new rules tests pass alongside the existing 15 per-user item tests.

- [ ] [qa] Updated item specs — update `AddItemModal.spec.js` to remove the `currentValue` field assertion; add assertions that `estimatedValue`/`sampleSize` appear in `ItemCard.vue`. Acceptance: updated specs pass with no removed coverage on the existing add-item contract.

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
