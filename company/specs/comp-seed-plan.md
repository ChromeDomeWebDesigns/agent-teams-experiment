# Comp Seed Plan

> Owner: PM / backend-engineer (execution).
> This document defines what to seed into the `comps` Firestore collection at POC launch,
> the document shape, the target counts, terms-of-service guidance, and the condition
> multiplier model the valuation engine applies.
> Do NOT edit: `company/specs/item-schema.md` (designer-owned).

---

## Purpose

The valuation engine (`lib/valuation.js`) is only as useful as the comp data behind it. A
cold-start with zero comps produces zero estimates — useless at POC. The seed dataset bridges
the gap: a few hundred hand-curated sold prices for the top vintage camera and lens models,
covering all condition tiers, compiled from public price-guide and sold-listing data before
any user has contributed.

The seed must be wide enough that the top models return confident estimates (sampleSize >= 5
per condition tier) and narrow enough to compile by hand in one session. Post-POC, user
contributions compound the dataset; the seed is the floor, not the ceiling.

---

## Comp document shape

Each document in `comps/{compId}` has the following fields. The `compId` is a UUID-v4
generated at seed time (consistent with the house logging pattern in `lib/logger.js`).

| Field | Type | Description |
|---|---|---|
| `make` | string | Brand name, title-cased. e.g. `"Leica"`, `"Nikon"`, `"Canon"` |
| `model` | string | Model name as commonly known. e.g. `"M3"`, `"F2"`, `"AE-1"` |
| `modelKey` | string | Normalized, lowercase, no-spaces key for index queries. e.g. `"leica-m3"`, `"nikon-f2"` |
| `condition` | string | One of the five tiers (see Condition model below). e.g. `"Excellent"` |
| `salePrice` | number | Sold price in USD (integer cents or float dollars — pick one and be consistent; the engine must match). |
| `saleDate` | string | ISO 8601 date of the sale. e.g. `"2024-09-15"`. Used for recency window filtering. |
| `source` | string | Human-readable citation. e.g. `"KEH.com sold listing, Sep 2024"`, `"Rangefinderforum sales thread, Oct 2024"`, `"UsedPhotoPro sold, Nov 2024"`. |
| `contributedBy` | string | `"seed"` for all seeded docs. User UID for user-submitted docs. |
| `status` | string | `"seed"` for seeded docs. `"verified"` for Admin-promoted docs. `"user-submitted"` for crowd entries. |
| `createdAt` | Firestore Timestamp | `admin.firestore.FieldValue.serverTimestamp()` at write time. |

The engine matches on `modelKey` (exact) and filters by `saleDate` within a recency window
(configurable; suggest 24 months for the POC to keep seed data in-window).

---

## Models to seed (concrete list)

Prioritize the top ~15 camera body models and top ~8 lens models by secondary-market
transaction volume and community interest. Cover all five condition tiers for each, with at
least 3–5 data points per tier where public data allows.

### Camera bodies

| Make | Model | `modelKey` | Notes |
|---|---|---|---|
| Leica | M3 | `leica-m3` | Most iconic Leica; strong price floor; wide resale data. |
| Leica | M6 | `leica-m6` | Highest-demand Leica; prices surged most dramatically since 2019. |
| Nikon | F2 | `nikon-f2` | Pro-spec 35mm SLR; active resale community. |
| Nikon | F3 | `nikon-f3` | Later pro Nikon SLR; slightly lower floor than F2. |
| Canon | AE-1 | `canon-ae-1` | Highest-volume entry-level SLR on the secondary market. |
| Canon | AE-1 Program | `canon-ae-1-program` | Variant; sufficiently different in price to warrant its own key. |
| Canon | F-1 | `canon-f1` | Pro Canon SLR; distinct price tier from AE-1. |
| Hasselblad | 500C/M | `hasselblad-500cm` | Medium-format; high per-unit value; strong insurance relevance. |
| Pentax | K1000 | `pentax-k1000` | Entry-level all-manual SLR; very high transaction volume. |
| Olympus | OM-1 | `olympus-om1` | Compact SLR; popular with students and travelers. |
| Olympus | OM-1n | `olympus-om1n` | Updated variant; price tier close to OM-1 but distinct. |
| Minolta | X-700 | `minolta-x700` | Common secondary market; good breadth of condition examples. |
| Contax | RTS II | `contax-rts-ii` | Higher-end SLR; fewer units but strong collector demand. |
| Rollei | Rolleiflex 2.8F | `rollei-2-8f` | TLR; distinct format; high-value, insurable. |
| Voigtlander | Bessa R2A | `voigtlander-bessa-r2a` | Modern rangefinder; growing collector interest. |

### Lenses

| Make | Model | `modelKey` | Notes |
|---|---|---|---|
| Leica | Summicron 50mm f/2 | `leica-summicron-50` | Most transacted Leica lens; wide price data. |
| Leica | Summilux 50mm f/1.4 | `leica-summilux-50` | High-value; distinct from Summicron. |
| Nikkor | 50mm f/1.4 AI-S | `nikkor-50-f14-ais` | Common Nikon manual lens; large comp pool. |
| Carl Zeiss | Planar 80mm f/2.8 | `zeiss-planar-80` | Standard Hasselblad lens; frequent resale companion to the body. |
| Canon | FD 50mm f/1.4 | `canon-fd-50-f14` | Very common; bellwether for Canon FD system health. |
| Voigtlander | Nokton 40mm f/1.4 | `voigtlander-nokton-40` | Modern M-mount; popular with rangefinder crowd. |
| Olympus | Zuiko 50mm f/1.4 | `olympus-zuiko-50-f14` | Standard OM lens; high transaction volume. |
| Pentax | SMC 50mm f/1.7 | `pentax-smc-50-f17` | Common kit lens resold independently. |

---

## Target counts

| Scope | Target |
|---|---|
| Unique `modelKey` values | ~23 (15 bodies + 8 lenses) |
| Condition tiers per model | 5 (Mint, Excellent, Good, Fair, Poor) |
| Data points per tier (target) | 3–5 |
| Total comp docs (seed) | ~230–460 |
| Practical floor (MVP) | ~150 docs — at least 3 per tier for the top 10 models |

The seed script writes all docs in a single Admin SDK batch; Firestore batch writes handle up
to 500 docs per batch. Split into multiple batches if the full seed exceeds that limit.

---

## Source guidance and ToS compliance

The seed compiles **publicly available, historical sold-price data** from secondary-market
venues and collector resources. We store it as a curated dataset under `status: 'seed'`, not
as live scraped data or a mirror of any proprietary feed. Each doc cites its source in the
`source` field.

Recommended public sources (use these):

- **KEH.com** — large used-camera dealer with publicly visible graded pricing; prices reflect
  actual retail-buy and trade-in values; not a live feed (no scraping).
- **UsedPhotoPro / MPB / Adorama used** — similar public retail pricing.
- **eBay completed/sold listings (browser-visible)** — manually observed sold prices from
  publicly visible completed listings. Do not use the Marketplace Insights API (partner-gated)
  or any eBay API endpoint that requires a developer key for the seed. Manual observation of
  publicly visible sold listings is standard price-guide practice.
- **Rangefinderforum, Photography-on-the-Net, r/photomarket** — community sales threads where
  sellers post asking/sold prices; widely used as informal price guides.
- **PriceCharting vintage camera section** (if available) — public price-guide data.

Do not:
- Scrape any site programmatically or at bulk volume; compile by hand or via a one-time
  manual export.
- Use any API endpoint that requires a paid subscription or partner agreement.
- Copy proprietary database exports or behind-paywall price guides.

Each doc's `source` field should read like: `"KEH.com used-excellent listing, observed
2025-Q4"` or `"eBay sold listing (manual observation), Oct 2024"`. This is consistent with
how published price guides (PriceCharting, CardLadder's public comps view) handle citations.

---

## Condition model

Five tiers, consistent with industry norms (KEH, MPB, and most used-gear retailers use a
similar five-point scale). The valuation engine applies **multipliers** relative to a
"Good" baseline (= 1.0) when matching within a `modelKey`. If the seed has sufficient comps
for the requested condition tier, the engine uses those directly (preferred). If the seed has
comps only for adjacent tiers, it applies the multiplier as a fallback.

| Condition | Label shown to user | Engine multiplier (relative to Good) |
|---|---|---|
| `"Mint"` | Mint (like new, with box) | 1.35 |
| `"Excellent"` | Excellent (light use, fully functional) | 1.15 |
| `"Good"` | Good (normal use, fully functional) | 1.00 |
| `"Fair"` | Fair (visible wear, functional) | 0.80 |
| `"Poor"` | Poor (heavy wear or needs service) | 0.60 |

The engine applies multipliers only as a fallback. If the requested condition tier has >=
`MIN_SAMPLE_SIZE` comps (suggest 3 for the POC), use those comps directly without multiplier
adjustment. If not, find the nearest tier with sufficient data and apply the multiplier to
estimate the requested tier. Surface `sampleSize` and `asOf` in the response so the UI can
show confidence level honestly ("based on 3 sales" vs. "based on 1 adjacent sale — estimate
may vary").

Cold-start edge case: if no comps exist for a model at any tier, return
`{ estimate: null, sampleSize: 0 }` and the UI shows "insufficient data — be the first to
log a sale." This is the expected crowd-DB tradeoff the observer accepted; do not invent a
number.

---

## Seed script location and execution

- Path: `product/server/scripts/seedComps.js`
- Runtime: `node product/server/scripts/seedComps.js` (requires `.env` with
  `FIREBASE_SERVICE_ACCOUNT_PATH` set and the service account in place).
- The script is idempotent by design: it checks for existing `status: 'seed'` docs by
  `modelKey` before writing, to avoid duplicate seeding on re-runs. (Or it targets a fixed
  doc ID per comp entry — either approach works; pick one and document it in the script
  header comment.)
- The script is not part of `npm start` or any CI pipeline — it runs once per environment
  setup.
