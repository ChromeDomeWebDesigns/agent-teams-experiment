# Company State

> Read this first every cycle. It is the resume point. Keep it short and current.

- **Phase:** 1 — Build (brief APPROVED)
- **Product:** Vault — collection manager w/ insurance docs. Beachhead: vintage cameras/lenses.
- **Active sprint:** Cycle 1 — scaffold `product/client` (Nuxt 2 SPA) + `product/server`
  (Express), wired with the house toolchain + logger/firebase plumbing, lint clean. No
  features yet.
- **Next action:** team scaffolds both apps (FE owns `product/client`, BE owns
  `product/server`), CEO integrates + commits + opens PR. Then cycle 2 = auth + item CRUD.
- **Active teammates:** (spawning) fe (frontend-engineer), be (backend-engineer)
- **Open blockers:**
  - Procurement: Firebase project + service account (see `company/PROCUREMENT.md`) — needed to
    actually run auth/DB; scaffolding proceeds without it (firebase init reads env, runs once
    keys exist).

## Cycle log pointer
Latest detail in `company/JOURNAL.md`. Latest commit: scaffold bootstrap (`cd7cbfd`).
