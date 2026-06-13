# Backlog

> Durable mirror of the team's task list (the live `~/.claude/tasks/` list is wiped at
> session end). The PM keeps this current. Items are small, independent, vertically sliced.
>
> Format: `- [ ] [role] <title> — <acceptance criteria>`  ·  blocked items: add `(blocked: …)`
> Roles: `frontend` · `backend` · `qa` · `design` · `pm`

## Now (cycle 4 — hardening + POC DoD gate) — Firebase provisioned; nothing here is blocked

- [x] [ceo] Dead-code cleanup — delete unused `components/AddItemForm.vue` + `AddItemForm.spec.js` (the shipped form is `AddItemModal.vue`) (cycle 4). NOTE: the earlier "drop the legacy `{formData, photoFile}` branch" item was based on a wrong assumption — `AddItemModal.vue` actually dispatches `addItem` with the `{formData, photoFile}` shape, so that is the LIVE, tested path, not dead. The flat-payload branch is the unused one. Normalizing the payload shape is a cosmetic refactor touching 4 files (modal + store + 2 specs) with no DoD value — dropped from POC scope.
- [ ] [frontend] Polish — client-side validation, loading/error states, responsive 768px+. Acceptance: add-item validates; states visible.
- [ ] [qa] Firestore rules emulator test — actually run `@firebase/rules-unit-testing` (spec exists, emulator-gated) to confirm cross-user deny. Acceptance: passes with the emulator running (file procurement if the emulator/Java isn't available).
- [ ] [ceo/qa] Live verify run — sign up → add a camera (with photo) → see total → export. Acceptance: works end-to-end against the real Firebase project (current tests are unit-level with mocks).
- [ ] [ceo] POC DoD check — verify all 5 DoD items met; summary to `company/JOURNAL.md`. Acceptance: DoD #1–5 all ✅.

## Later (POST-POC — do not start before DoD is met)

- [ ] Valuation history: timestamped value log per item + collection total over time.
- [ ] Automated price feeds / sold-comp lookups.
- [ ] Category expansion beyond vintage cameras/lenses.
- [ ] Trading/marketplace + social features.
- [ ] Mobile native app.
- [ ] Payments/subscriptions.

## Done

- [x] [ceo] Phase 0 discovery + approved brief (cycle 0).
- [x] [fe/be] Scaffold product/client (Nuxt 2 SPA) + product/server (Express) (cycle 1).
- [x] [pm] POC Definition of Done + per-cycle targets in PRODUCT_BRIEF.md (cycle 2).
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
