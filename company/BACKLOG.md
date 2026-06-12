# Backlog

> Durable mirror of the team's task list (the live `~/.claude/tasks/` list is wiped at
> session end). The PM keeps this current. Items are small, independent, vertically sliced.
>
> Format: `- [ ] [role] <title> — <acceptance criteria>`  ·  blocked items: add `(blocked: …)`
> Roles: `frontend` · `backend` · `qa` · `design` · `pm`

## Now (cycle 2 — auth + item foundation)
- [ ] [design] Define the v1 item data model + add-item flow for vintage cameras/lenses
      (fields: make, model, serial, condition, purchase price/date, current value, photos) —
      acceptance: documented schema + a simple wireframe in company/.
- [ ] [backend] Firestore data model + security rules for per-user `items` with a
      `valuations` sub-collection — acceptance: rules deny cross-user access; documented.
      (blocked: Firebase creds)
- [ ] [frontend] Auth (email/password) via Firebase Auth + a logged-in shell/route guard —
      acceptance: sign up / sign in / sign out works against a real project.
      (blocked: Firebase creds)
- [ ] [frontend] Add-item form + item gallery reading/writing Firestore — acceptance: a user
      can add an item with photo and see it in the list. (blocked: Firebase creds)
- [ ] [qa] Specs for the auth store module + add-item flow (mock Firestore + store).

## Next
- [ ] [backend] Valuation history: append timestamped values; compute collection total.
- [ ] [frontend] Per-item valuation history view + total collection value.
- [ ] [backend] Insurance-ready PDF export endpoint (itemized list + photos + totals).
- [ ] [frontend] "Export for insurance" action wired to the PDF endpoint.

## Later
- [ ] Automated price feeds / sold-comp lookups (deliberately deferred from v1).
- [ ] Category expansion beyond vintage cameras.
- [ ] Trading/marketplace + sharing.

## Done
- [x] [ceo] Phase 0 discovery + approved brief (cycle 0).
- [x] [frontend] Scaffold product/client Nuxt 2 SPA (cycle 1).
- [x] [backend] Scaffold product/server Express skeleton (cycle 1).
