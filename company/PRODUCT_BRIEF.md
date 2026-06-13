# Product Brief

<!--
  GATE: The team must NOT build while this says PENDING.
  The CEO fills this in during Phase-0 discovery, sets Approval: PENDING, and notifies the
  human. The human flips it to APPROVED (and may edit) to authorize building.
-->

**Approval: APPROVED**
**Approved by:** zcuddy (human)
**Date (original):** 2026-06-12
**Pivoted:** 2026-06-13 (ADR-0006 — observer accepted)
**Working name:** Vault (placeholder — rename welcome)
**Locked beachhead:** Vintage cameras & lenses (data model stays category-extensible)

## Problem

Vintage camera and lens collectors operate in an opaque, condition-driven market that has
moved 50–200% since 2019 on the analog revival. Their two most important questions are ones
that a spreadsheet structurally cannot answer:

1. **"What's my collection worth today?"** Values drift constantly; condition is a major
   multiplier; and there is no public index for vintage cameras the way there is for cars or
   stocks. Collectors either guess, pay for appraisals, or watch forum threads.

2. **"Is this a good buy?"** When a collector finds a Leica M6 on eBay or at a local camera
   shop, they have no fast, trustworthy way to know whether the asking price is fair, high, or
   a steal. The information asymmetry favors dealers.

The underlying cause is the same: **no shared, searchable record of what cameras and lenses
actually sold for** — condition-adjusted and recent. CardLadder ($20/mo) built that database
for trading cards. Discogs built it for vinyl. BrickLink built it for LEGO. There is no
equivalent for cameras. That gap is the product.

Data entry and storage (a catalog, a spreadsheet replacement) does not solve this. The
collector is already in their spreadsheet; that part works. What fails them is the
**intelligence layer** on top: live per-item estimates, deal verification, and a portfolio
total they can trust.

## Market gap / why now

Discovery (ADR-0002, cross-referenced with the pivot in ADR-0006) confirmed the pattern:

- **CardLadder** charges $20/month for a proprietary sales database + live per-card value +
  daily portfolio movement — not for a list. The list is the loss leader.
- **Discogs** monetizes the sales database (marketplace fees, subscription pricing data) — not
  the catalog.
- **BrickLink** is the price guide and marketplace; the inventory tracker is a byproduct.

In every case the **moat is the market intelligence**, not the storage. The vintage camera
market has communities (r/AnalogCommunity, Photography-on-the-Net, Rangefinderforum, active
FB groups), high per-item values (→ real insurance and deal-risk stakes), and zero equivalent
to CardLadder/Discogs. The collectors building their own sold-price spreadsheets are doing the
hard work manually; they would contribute to a shared, crowd-sourced database if one existed.

The analog revival makes the timing acute: the market is volatile enough that stale prices
mislead, but active enough that users will contribute new comps regularly.

## Target user

**Beachhead: vintage camera and lens collectors.** Passionate, high per-item value (real
insurance and deal-risk stakes), concentrated in reachable online communities, and currently
spreadsheet-bound with no dedicated price-intelligence tool.

They open the app most often when: (a) they are considering a purchase and want a fast deal
check, or (b) they are curious what their portfolio is worth after a run-up in prices. The
insurance export comes up only when something happens — it must be correct, but it is not the
reason they return weekly. The deal check is.

Data model stays **category-extensible** — the engine and comp schema generalize to any
collectible.

## Proposed solution (v1 thesis)

A market-aware collection manager for vintage camera/lens collectors with two core capabilities:

1. **Living, comp-backed valuation.** Adding an item (make/model/condition) yields a
   computed `estimatedValue` — a median estimate with a low/high range and a sample size —
   derived from a shared, crowd-sourced sales dataset (`comps` collection). No manual value
   entry required. The portfolio total is the sum of these estimates. As comps accumulate,
   estimates sharpen.

2. **"Good buy?" deal check.** A dedicated page: enter make/model/condition/asking price →
   get an under/at/over-market verdict against the comp range, with the sample count shown so
   the user knows the confidence level. This is the weekly-use hook that brings collectors
   back between portfolio updates.

Both capabilities ride the same `comps` dataset, seeded by us and compounded by users via a
"log a sale" action (the crowd loop). This dataset is the moat.

**Insurance export** survives as a byproduct: the itemized output now shows comp-backed
estimates and "based on N recent sales" evidence per item — a more credible artifact for an
adjuster than a self-typed number. The export is not the differentiator; accurate values are.

The v1 user loop:
1. Sign up → add items (make/model/condition) → see computed estimates and a live portfolio
   total.
2. Spot a listing → open Deal Check → get a verdict in seconds.
3. After buying or selling → "Log a sale" → the shared dataset gets stronger.
4. Something happens to the collection → export the comp-backed insurance document.

## Why this stack fits

- **`comps` collection (Firestore, top-level, shared):** documents are indexed by `modelKey`
  (normalized make+model) with `condition`, `salePrice`, `saleDate`, `status`. Range queries
  by `modelKey` + recency are exactly what Firestore handles well.
- **Server-side valuation engine (`lib/valuation.js`, Express, Admin SDK):** a pure function
  over an injected comp set — easy to unit-test in isolation; runs server-side so the matching
  and multiplier logic is not exposed to the client.
- **Deal-check and valuation endpoints** reuse the same engine behind `verifyFirebaseToken`
  middleware; no second auth system needed.
- **Nuxt 2 SPA** handles the gallery, deal-check page, and log-a-sale form with the existing
  Vuex + axios pattern.
- **No paid third-party APIs required.** The crowd-sourced design eliminates the external-API
  dependency on the POC critical path. eBay Marketplace Insights (sold listings) is
  partner-gated and effectively unavailable to small projects; we are applying for access as a
  parallel bet (see PROCUREMENT) but do not need it to ship.

## Success criteria (pivot POC)

- A collector can add items by make/model/condition and immediately see a computed estimate
  with a range and sample count — no manual value entry.
- They can run a deal check on any listed item and get a verdict in under 10 seconds.
- They can log a sale and see the estimate for that model shift (demonstrating the crowd loop).
- The insurance export shows comp-backed estimates and evidence, not blank/manual values.
- At least the top 10 camera models in the seed dataset return confident estimates (sampleSize
  >= 5 per condition tier), so the POC is demonstrable without needing user contributions.

**Validation target (unchanged):** 5–10 collectors from one community use it on their real
collection and >= 3 say they would keep using it / it beats their spreadsheet.

## Out of scope (for the pivot POC)

- **Valuation history over time** — timestamped value log per item, history chart. Post-POC.
- **Automated sold-comp ingestion** — live scraping or a paid API feed. Post-POC (and gated
  on eBay partner access if that path materializes).
- **Real-time listing alerts** — "watch this model and alert me when a listing is under X."
  Requires a listing feed we do not have. Post-POC.
- **Lightweight moderation / flagging** of user-submitted comps. Post-POC.
- **Watchlist** (save a model for quick re-check). Inbound alerts depend on a feed we do not
  have; the page-load deal-check covers the POC use case. Post-POC.
- Category expansion, trading/marketplace, social features, mobile native app,
  payments/subscriptions.

---

## POC Definition of Done

> Supersedes ADR-0005's original 5-item DoD (which described the rejected ledger product).
> Proposed deadline: **2026-06-20** (7 days from pivot approval 2026-06-13; CEO-confirmable).
> When every item below is checked, the pivot POC is complete — we stop and summarize.
> We do NOT iterate further without human direction. No gold-plating.

1. **Computed value.** Adding an item by make/model/condition yields a computed
   `estimatedValue` — a median estimate, low/high range, and sample size — drawn from the
   `comps` dataset. No manual value field is required. A user override is allowed but not
   prompted. Verified by: add a Leica M3 in Excellent condition; confirm the app returns a
   numeric estimate with a range and a sampleSize >= 1 (from seed data) without the user
   typing a price.

2. **Living portfolio total.** The gallery displays a per-item comp-backed estimate (with
   "based on N sales" label) and a running collection total that is the sum of estimates (or
   user overrides). Verified by: add two items; confirm the total equals the sum of their
   individual estimates; confirm the "N sales" label is visible on each card.

3. **Deal check.** The deal-check page accepts make/model/condition/asking price and returns
   an under/at/over-market verdict against the comp range, with the sample count shown.
   Verified by: enter a Leica M3 Excellent at an asking price well above the known seed range;
   confirm the app returns "over market" with a non-zero sample count.

4. **Crowd loop.** An authenticated user can submit a "log a sale" entry (make/model/condition/
   salePrice/saleDate); the submission is written to `comps` with `contributedBy = uid` and
   `status = 'user-submitted'`. Running a subsequent valuation query for that model returns an
   estimate that incorporates the new comp (sampleSize increases or estimate shifts).
   Verified by: log a sale for a model currently not in the seed; confirm the item's estimate
   now returns a result (sampleSize >= 1) where it previously returned "insufficient data."

5. **Insurance export.** The export endpoint returns a printable document in which each line
   item shows the comp-backed estimate and a "based on N recent sales" evidence note — not a
   blank or a manually typed number. Verified by: trigger export after adding two seeded items;
   confirm each line shows a numeric estimate and a non-zero N.

6. **Quality gate.** All of the following must be true simultaneously:
   - Per-user `users/{uid}/items` Firestore rules still deny cross-user access (existing
     emulator tests remain green).
   - `comps` Firestore rules pass emulator tests: authed users can read; authed user can
     create a `user-submitted` comp where `contributedBy == request.auth.uid`; client cannot
     write `seed` or `verified` comps; unauthenticated write is denied.
   - Valuation engine (`lib/valuation.js`) has passing unit tests covering: correct estimate
     for a known comp set, condition-multiplier application, "insufficient data" path when
     sampleSize < threshold.
   - Deal-check endpoint has passing integration/unit tests.
   - `npm run lint` passes clean on both client and server.
   - Changes are on a feature branch with a PR reviewed and merged to `main` by
     `code-reviewer`.

### Explicitly post-POC (do not build before DoD is met)

- Valuation history over time (timestamped value log per item, history chart).
- Automated sold-comp ingestion (live scraping or paid API feed).
- Real-time listing / deal alerts.
- Moderation and flagging of user-submitted comps.
- Watchlist.
- Category expansion, trading/marketplace, social features, mobile native app.

---

## Targets / cadence to 2026-06-20

- **Cycle 5 (now):** Backend — valuation engine, comp seed script, deal-check and valuation
  endpoints, updated export template, `comps` Firestore rules. Frontend — computed values in
  store/gallery/item card, deal-check page, log-a-sale action+form, remove manual-value field.
  QA — valuation unit tests, deal-check tests, comps emulator rules tests, updated item specs.
- **Cycle 6 (if needed):** Integration hardening — cold-start UX ("limited data" messaging),
  end-to-end verification run against live Firebase, final quality gate pass.

We stop at the pivot POC DoD. No further cycles without human direction.
