# Decision Log (ADR-style)

> One short entry per non-trivial decision. Newest at top.
> Format: ID · date · decision · context/why · consequences.

## ADR-0003 · 2026-06-12 · Autonomous governance — human is observer; `code-reviewer` owns review + merge
- **Decision:** The human is an **observer**, not an approver. The company owns the full loop
  end to end (discovery → decisions → build → **review → merge to `main`**). Add a new
  `code-reviewer` agent that independently reviews each PR and is the **sole merge authority**
  (`gh pr merge --squash --delete-branch`); the CEO/engineers never merge. Drop the human
  product-approval gate (CEO owns direction). The only remaining human touchpoint is
  **procurement** (secrets / paid resources that can't be self-served).
- **Why:** Owner requested it — "I am an observer here, this is the CEO and team's product."
  Separation of duties (an independent reviewer, not the author, merges) keeps quality honest.
- **Consequences:** `main` changes only via reviewer-merged PRs. Merge authority is enforced
  by role policy, not a hook (the push-to-main guard can't see `gh pr merge`); GitHub branch
  protection can harden it later. CLAUDE.md §1/§2/§3/§7/§8, WORKING_AGREEMENTS, and the new
  `.claude/agents/code-reviewer.md` updated to match.

## ADR-0002 · 2026-06-12 · Build "Vault" — collection manager w/ insurance docs (beachhead: vintage cameras)
- **Decision:** First product = a collection-management web app whose differentiator is
  insurance-ready documentation + valuation history. v1 beachhead = vintage cameras & lenses;
  data model category-extensible. Approved by the human at the Phase-0 gate.
- **Why:** Discovery found the obvious adjacent gaps already served (nonprofit tooling,
  food-safety logging) and horizontal CRM crowded; passionate niche collectors remain
  spreadsheet-bound and lack provable insurance records + valuation tracking. Strong
  Firestore fit; no paid APIs needed for v1.
- **Consequences:** v1 excludes price feeds, marketplace, multi-user, payments. Needs a
  Firebase project + service account (see PROCUREMENT). Validation is qualitative (5–10
  real collectors). See `company/PRODUCT_BRIEF.md`.

## ADR-0001 · Bootstrap · Adopt the `thereanalyzer` stack verbatim
- **Decision:** Frontend = Nuxt 2 + Vue 2 SPA; Backend = Express 4 (CommonJS); DB = Firebase/
  Firestore (modular web SDK on client, admin SDK on server); plain JavaScript; npm; ESLint
  `@nuxtjs` + Prettier (`semi:false`, single quotes); tests = `@vue/test-utils` v1 + Jest.
- **Why:** Match the owner's real, existing conventions exactly (reference repos
  `thereanalyzer-client` / `thereanalyzer-server`).
- **Consequences:** No TypeScript; Nuxt 2 is EOL (accepted to match house style); secrets must
  be handled via `.env` (the reference repos' committed secrets are an anti-pattern we reject).
