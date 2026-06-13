# Product Brief

<!--
  GATE: The team must NOT build while this says PENDING.
  The CEO fills this in during Phase-0 discovery, sets Approval: PENDING, and notifies the
  human. The human flips it to APPROVED (and may edit) to authorize building.
-->

**Approval: APPROVED**
**Approved by:** zcuddy (human)
**Date:** 2026-06-12
**Working name:** Vault (placeholder — rename welcome)
**Locked beachhead:** Vintage cameras & lenses (data model stays category-extensible)

## Problem
Serious hobby collectors track high-value collections in spreadsheets, photos scattered in
their camera roll, and forum posts. This breaks down in two moments that matter most:
1. **Insurance / loss.** After theft, fire, or damage, collectors can't produce the
   documented proof (itemized list, photos, condition, value, provenance) that insurers
   require to pay a claim.
2. **Valuation drift.** Collection value changes over time; spreadsheets don't track value
   history, so collectors don't actually know what they own or what it's worth.

## Market gap / why now
Discovery (7 web searches) consistently surfaced collectors as an **underserved** segment
needing "inventory management tailored to their hobbies — cataloging, valuation tracking,
insurance documentation, and trading facilitation." Crucially, the *obvious* adjacent gaps
turned out already served, which is what makes this one stand out:
- Small-nonprofit volunteer/donation tools — **served** (POINT, Timecounts, Wave; free tiers).
- Small food-business HACCP/temperature logging — **served** (FoodDocs, Zip HACCP, SafetyCulture).
- Horizontal solo-service CRM/scheduling — **crowded** (Jobber/Housecall et al., the very
  "bloated/expensive" tools people complain about).

The **long tail of collectible categories** is the opposite: the biggest categories have
apps (cards → CardLadder/Collectr; vinyl → Discogs; LEGO → BrickLink), but passionate niche
categories (vintage cameras & lenses, film/audio gear, fountain pens, etc.) live in
spreadsheets. The wedge competitors miss: **insurance-ready documentation** + **valuation
history**, not just a list.

## Target user
**Beachhead (recommended): vintage camera & lens collectors.** Passionate, high per-item
value (→ real insurance relevance), highly reachable in active online communities
(r/AnalogCommunity, forums, FB groups), and currently spreadsheet-bound with no dedicated
tool. Data model stays **category-extensible** so we can expand to adjacent niches later.
> ⚠️ Beachhead choice is the main strategic call for your review — see "Open question."

## Proposed solution (v1 thesis)
The simplest way for a collector to **catalog, value, and insure** a collection.
v1 = a focused web app where a logged-in user can:
- Add items with photos, category-specific fields (make/model/serial/condition/notes),
  purchase price + date, and a manually-entered current value.
- Track **valuation history** per item (a timestamped value log) and see total collection value.
- Generate an **insurance-ready export** (PDF/printable): itemized list with photos, values,
  totals, and a generated date — the artifact you hand an insurer or adjuster.

## Why this stack fits
- **Firestore** is ideal: per-user `collections/items` documents, each with a sub-collection
  of timestamped `valuations`; real-time updates; no relational/analytical queries needed.
- **Firebase Storage** holds item photos. **Firebase Auth** for sign-in.
- **Nuxt 2 SPA** for the catalog/gallery UI; **Express** for server-side concerns (auth'd
  PDF export generation, future price-data integrations) via the Admin SDK.
- No paid third-party APIs required for v1 (valuation is manual; automated price feeds are a
  deliberate Phase-2 deferral).

## Success criteria (v1)
- A collector can add 20 items with photos in one sitting without friction.
- They can produce an insurance-ready PDF of their collection.
- **Validation target:** 5–10 collectors from one community use it on their real collection
  and ≥3 say they'd keep using it / it beats their spreadsheet. (Qualitative, not revenue.)

## Out of scope (for v1)
- Automated/market price feeds, eBay/sold-comp integrations.
- Trading/marketplace, social features, multi-user/shared collections.
- Mobile native app (responsive web only), payments/subscriptions.

## Required resources / procurement
- **A Firebase project** (free Spark tier is fine for v1) — provides the client config
  (`FIREBASE_*`) and a server **service-account JSON** (`FIREBASE_SERVICE_ACCOUNT_PATH`,
  kept outside the repo). Logged in `company/PROCUREMENT.md`.
- Nothing else for v1. (Domain/hosting deferred until there's something to ship.)

## Open question for the human (please weigh in at approval)
1. **Beachhead category** — go with vintage cameras/lenses (recommended: underserved +
   reachable), or do you prefer a bigger-but-more-competitive category (e.g., trading cards),
   or a different collectible you have access to a community for?
2. **Working name** — keep "Vault" placeholder or set your own?

---

## POC Definition of Done

> Deadline: **2026-06-19**. When every item below is checked, the POC is complete — we stop
> and summarize. We do NOT iterate further without human direction.

1. **Auth.** A user can sign up and sign in with email/password (Firebase Auth). All app
   routes except /login and /signup are guarded; unauthenticated access redirects to /login.
2. **Add item.** A logged-in user can submit a form to add a vintage camera/lens item with:
   make, model, serial number, condition, purchase price, purchase date, current value, and
   at least one photo. The item is persisted to their Firestore `items` collection.
3. **Gallery.** The user can view all their items in a list/gallery with total collection
   value displayed. Items belong strictly to the authenticated user (no cross-user leakage).
4. **Insurance export.** The user can trigger an export that produces a printable/PDF
   document containing: itemized list with photos, make/model, condition, value per item,
   collection total, and a generated date. This is the core differentiator — it must work
   end-to-end (client action → server endpoint → rendered output the user can print/save).
5. **Quality gates.** Per-user Firestore security rules deny cross-user document access
   (verified by test). Core flows (auth store, add-item form) have passing unit tests.
   `npm run lint` passes clean. Changes are committed on a feature branch with a PR open
   against `main`.

### Explicitly POST-POC (do not build before DoD is met)
- Valuation history over time (timestamped value log per item, history chart).
- Automated price feeds or sold-comp lookups.
- Category expansion, trading/marketplace, social features, mobile native app.

---

## Targets / cadence to 2026-06-19

- **Cycle 2 (now):** Firebase wiring — Auth (email/password), Firestore data model +
  security rules, add-item form, item gallery. Blocked on human procurement of Firebase
  creds.
- **Cycle 3:** Insurance export — server-side PDF/print endpoint, client "Export" action
  wired end-to-end. Polish: form validation, error states, basic responsive layout.
- **Cycle 4:** Hardening — QA coverage on auth store + add-item flow, security-rules test,
  lint gate, PR to `main`. POC DoD check.

We stop at POC. No further cycles without human direction.
