# Backlog

> Durable mirror of the team's task list (the live `~/.claude/tasks/` list is wiped at
> session end). The PM keeps this current. Items are small, independent, vertically sliced.
>
> Format: `- [ ] [role] <title> — <acceptance criteria>`  ·  blocked items: add `(blocked: …)`
> Roles: `frontend` · `backend` · `qa` · `design` · `pm`

## Now (cycle 3 — insurance export + cleanup) — Firebase provisioned; nothing here is blocked

- [ ] [backend] Insurance export endpoint — implement `GET /api/export`: fetch the caller's items via Admin SDK, return printable HTML/PDF (itemized list + photos + values + total + date). A 501 stub + `verifyFirebaseToken` already exist. Acceptance: authed request returns a populated export for the caller's items only.
- [ ] [frontend] "Export for insurance" action — gallery button calls the endpoint; opens print dialog or download. Acceptance: button produces the export for the signed-in user.
- [ ] [frontend] Dead-code cleanup — delete `components/AddItemForm.vue` + `AddItemForm.spec.js` (unused; `AddItemModal.vue` is the shipped form); add a spec for `AddItemModal.vue`; drop the legacy `{formData, photoFile}` branch in `store/items.js` `addItem`. Acceptance: no unused component; AddItemModal has a passing spec.
- [ ] [frontend] Polish — client-side validation, loading/error states, responsive 768px+. Acceptance: add-item validates; states visible.
- [ ] [ceo/qa] Live verify run — sign up → add a camera (with photo) → see total → export. Acceptance: works end-to-end against the real Firebase project (current tests are unit-level with mocks).

## Next (cycle 4 — hardening + POC DoD gate)

- [ ] [qa] Firestore rules emulator test in CI — `@firebase/rules-unit-testing` (spec exists, emulator-gated) confirms cross-user deny. Acceptance: passes with the emulator.
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
