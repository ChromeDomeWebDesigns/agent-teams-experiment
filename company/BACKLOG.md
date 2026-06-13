# Backlog

> Durable mirror of the team's task list (the live `~/.claude/tasks/` list is wiped at
> session end). The PM keeps this current. Items are small, independent, vertically sliced.
>
> Format: `- [ ] [role] <title> — <acceptance criteria>`  ·  blocked items: add `(blocked: …)`
> Roles: `frontend` · `backend` · `qa` · `design` · `pm`

## Now (cycle 4 — hardening + POC DoD gate) — Firebase provisioned; nothing here is blocked

- [x] [ceo] Dead-code cleanup — delete unused `components/AddItemForm.vue` + `AddItemForm.spec.js` (the shipped form is `AddItemModal.vue`) (cycle 4). NOTE: the earlier "drop the legacy `{formData, photoFile}` branch" item was based on a wrong assumption — `AddItemModal.vue` actually dispatches `addItem` with the `{formData, photoFile}` shape, so that is the LIVE, tested path, not dead. The flat-payload branch is the unused one. Normalizing the payload shape is a cosmetic refactor touching 4 files (modal + store + 2 specs) with no DoD value — dropped from POC scope.
- [x] [ceo] Firestore rules emulator test — ran `@firebase/rules-unit-testing` against the Firestore emulator (`npx firebase-tools emulators:exec --only firestore`); 15 rules tests pass (cross-user deny proven). Fixed Jest+undici `ReadableStream` via server `jest.config.js`/`jest.setup.js`. Default `npm test` still skips rules without the emulator (CI-safe) (cycle 4).
- [x] [ceo] POC DoD check — all 5 DoD items verified met; summary in `company/JOURNAL.md` (cycle 4).
- [ ] [observer] Live verify run — sign up → add a camera (with photo) → see total → export, against the real Firebase project. Observer-owned because it writes real data to their project (or authorize a Playwright E2E). Not a numbered DoD criterion; server↔live-Firestore already verified (admin read OK 2026-06-13).
- [ ] [frontend] (post-POC) Polish — client-side validation, loading/error states, responsive 768px+. Acceptance: add-item validates; states visible.

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
