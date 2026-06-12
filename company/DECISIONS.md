# Decision Log (ADR-style)

> One short entry per non-trivial decision. Newest at top.
> Format: ID · date · decision · context/why · consequences.

## ADR-0001 · Bootstrap · Adopt the `thereanalyzer` stack verbatim
- **Decision:** Frontend = Nuxt 2 + Vue 2 SPA; Backend = Express 4 (CommonJS); DB = Firebase/
  Firestore (modular web SDK on client, admin SDK on server); plain JavaScript; npm; ESLint
  `@nuxtjs` + Prettier (`semi:false`, single quotes); tests = `@vue/test-utils` v1 + Jest.
- **Why:** Match the owner's real, existing conventions exactly (reference repos
  `thereanalyzer-client` / `thereanalyzer-server`).
- **Consequences:** No TypeScript; Nuxt 2 is EOL (accepted to match house style); secrets must
  be handled via `.env` (the reference repos' committed secrets are an anti-pattern we reject).
