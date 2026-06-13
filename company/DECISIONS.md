# Decision Log (ADR-style)

> One short entry per non-trivial decision. Newest at top.
> Format: ID · date · decision · context/why · consequences.

## ADR-0006 · 2026-06-13 · PIVOT — from a collection ledger to a market-aware collection
- **Decision:** Pivot the product. Stop building "Vault" as a place to *store* a collection
  (catalog → list → insurance PDF). Build the thing that **knows what a collection is worth
  and what's moving in the market**: a *living, comp-backed valuation* per item + total
  ("what's it worth today?") and a *"good buy?" deal check* ("is this listing fair?"), both
  powered by a **crowd-sourced sales dataset** (seed a curated set, then users contribute and
  correct). Insurance export is retained but **demoted to a byproduct** of accurate values,
  not the differentiator. Beachhead unchanged: vintage cameras/lenses; model stays
  category-extensible. This is a **re-direction onto the cycle 1–4 substrate, not a rewrite.**
- **Why:** The observer rejected the shipped POC: *"This is a CRUD example app… data entry and
  storage is not a solution. Customers are in spreadsheets because spreadsheets solve data
  entry."* They are right, and **our own ADR-0002 discovery proves it**: we named CardLadder
  (cards), Discogs (vinyl), BrickLink (LEGO) as the served comparables, then copied the
  *commodity half* (the inventory list) and skipped the *moat half* (the market intelligence).
  CardLadder charges **$20/mo** for a proprietary sales DB + live per-item value + daily
  movement — not for a list. Collectors' real problem is **information asymmetry**, not data
  entry: the vintage-camera market is opaque, condition-driven, and volatile (up 50–200% since
  2019), and a spreadsheet cannot answer "what's it worth today?" or "is this a good buy?".
  There is no CardLadder for cameras. That gap is the product.
- **Observer steers (locked, 2026-06-13):** (1) Problem vector = **Both** — living valuation is
  the core (powers portfolio + insurance + future history); the "good buy?" deal check is the
  weekly-use hook; both ride the same comp data. (2) Comp data = **crowd-sourced sales DB**
  (moat), seeded by us, no external-API dependency on the POC critical path.
- **Constraint:** eBay **Marketplace Insights API (sold listings) is partner-gated / effectively
  unavailable** to small projects (confirmed via eBay developer forums). So automated sold-comp
  ingestion is **not** on the POC path. Seed = a few hundred hand-curated public sale prices
  (`status: 'seed'`); the dataset then compounds via user submissions. Applying for eBay
  partner access is an **optional, non-blocking** parallel bet (PROCUREMENT).
- **Consequences:** New top-level `comps` collection + server-side valuation engine
  (`lib/valuation.js`); item `currentValue` becomes a *computed* `estimatedValue` (+ optional
  user override); new deal-check page/endpoint; "log a sale" crowd loop; export template shows
  comp evidence; `firestore.rules` adds `comps` (authed read; user can only create own
  `user-submitted` comps; `seed`/`verified` are Admin-only). Per-user item rules unchanged.
  ADR-0005's old 5-item DoD is **superseded** by the new pivot DoD (PM to finalize in the
  brief). Valuation *history over time* remains post-POC.

## ADR-0005 · 2026-06-12 · POC deadline set to 2026-06-19; valuation history deferred post-POC
> **SUPERSEDED by ADR-0006 (2026-06-13).** The original 5-item DoD (auth / add item / gallery /
> insurance-PDF-as-differentiator / quality gate) described the rejected ledger product. The
> insurance PDF is no longer the differentiator. See ADR-0006 for the new thesis + DoD.

- **Decision:** The working POC must be complete by 2026-06-19 (~7 days from approval).
  Valuation history (timestamped value log per item) and automated price feeds are explicitly
  deferred to post-POC. The POC DoD is 5 objectively verifiable items: auth, add item,
  gallery with total value, insurance export end-to-end, quality gates. See
  `company/PRODUCT_BRIEF.md § POC Definition of Done`.
- **Why:** Tight deadline prevents endless iteration. The insurance export (the core
  differentiator) must ship in the POC to validate the thesis. Valuation history adds real
  value but is not required to validate "can a collector catalog items and export for insurance."
- **Consequences:** The team stops when DoD is met or the deadline passes. No cycle may add
  features not in the DoD without re-scoping this ADR. Valuation history is the first
  post-POC item if the thesis validates.

## ADR-0004 · 2026-06-12 · Merge governance under a single GitHub account
- **Decision:** With one authenticating GitHub account (ChromeDomeWebDesigns), the
  `code-reviewer` cannot use `gh pr review --approve` on the company's own PRs (GitHub blocks
  self-approval). The accepted flow: the reviewer records its verdict as a **PR comment** and
  **squash-merges** (`gh pr merge --squash --delete-branch`). No branch protection requiring
  an approving review (it would be unsatisfiable on one account).
- **Why:** Surfaced when the reviewer merged PR #1. Keeps the autonomous loop unblocked.
- **Consequences / open option for the observer:** To get a *formally enforced* second-set-
  of-eyes gate, provision a **second GitHub identity** (e.g., a bot account) for either the
  authoring or reviewing side, then enable branch protection requiring 1 approval. Until
  then, merge authority is enforced by **role policy** (only `code-reviewer` merges), not by
  GitHub. Status-check-only branch protection (no required review) remains compatible.

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
