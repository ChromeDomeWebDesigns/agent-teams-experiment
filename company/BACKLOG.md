# Backlog

> Durable mirror of the team's task list (the live `~/.claude/tasks/` list is wiped at
> session end). The PM keeps this current. Items are small, independent, vertically sliced.
>
> Format: `- [ ] [role] <title> — <acceptance criteria>`  ·  blocked items: add `(blocked: …)`
> Roles: `frontend` · `backend` · `qa` · `design` · `pm`

## Now (cycle 2 — Firebase wiring + auth + item CRUD)

- [x] [design] Item data model + add-item flow spec — schema + wireframe in `company/specs/item-schema.md`.
- [x] [backend] Firestore + Storage security rules — `firestore.rules`, `storage.rules`, `firebase.json`, `product/server/FIRESTORE_MODEL.md`.
- [ ] [frontend] Firebase Auth (blocked: Firebase creds) — email/password sign up/in/out; Vuex `auth` store; route guard. Acceptance: guarded routes redirect to /login when logged out.
- [ ] [frontend] Add-item form + item gallery (blocked: Firebase creds) — all fields + photo upload; gallery reads user's items; total value displayed. Acceptance: add item with photo → visible in gallery.
- [ ] [qa] Unit specs: auth store + add-item form (blocked: in progress task #4) — mock Firestore + http layer; happy + error paths. Acceptance: `npm test` passes; no real Firebase calls.

## Next (cycle 3 — insurance export + polish)

- [ ] [backend] Insurance export endpoint (blocked: Firebase creds + cycle-2 auth) — `GET /api/export` fetches items via Admin SDK, returns printable HTML/PDF. Scaffold exists (returns 501).
- [ ] [frontend] Export for insurance action (blocked: cycle-2 gallery + cycle-3 endpoint) — gallery button calls export endpoint; opens print dialog or download.
- [ ] [frontend] Polish (blocked: cycle-2 add-item form) — client-side validation, loading/error states, responsive layout 768px+.

## Next (cycle 4 — hardening + POC DoD gate)

- [ ] [qa] Firestore security rules test (blocked: cycles 2+3 complete) — `@firebase/rules-unit-testing` confirms cross-user deny. Acceptance: test passes in CI.
- [ ] [ceo] POC DoD check (blocked: all prior cycles complete) — verify all 5 DoD items met; summary to `company/JOURNAL.md`.

## Later (POST-POC — do not start before DoD is met)

- [ ] Valuation history: timestamped value log per item + collection total over time. (blocked: POC DoD)
- [ ] Automated price feeds / sold-comp lookups. (blocked: POC DoD)
- [ ] Category expansion beyond vintage cameras/lenses. (blocked: POC DoD)
- [ ] Trading/marketplace + social features. (blocked: POC DoD)
- [ ] Mobile native app. (blocked: POC DoD)
- [ ] Payments/subscriptions. (blocked: POC DoD)

## Done

- [x] [ceo] Phase 0 discovery + approved brief (cycle 0).
- [x] [frontend] Scaffold product/client Nuxt 2 SPA (cycle 1).
- [x] [backend] Scaffold product/server Express skeleton (cycle 1).
- [x] [pm] POC Definition of Done + per-cycle targets formalized in PRODUCT_BRIEF.md (cycle 2).
- [x] [design] Item data model + add-item flow spec in company/specs/item-schema.md (cycle 2).
- [x] [backend] Firestore + Storage security rules + FIRESTORE_MODEL.md (cycle 2).
- [x] [backend] Insurance export route scaffold + verifyFirebaseToken middleware (cycle 2).
- [x] [pm] jest.config.js: skip vue-jest style compilation to fix test suite (cycle 2).
