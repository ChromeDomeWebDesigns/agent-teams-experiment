# Spec: Valuation, Deal Check, Log a Sale UX

> Owner: product-designer  |  Cycle: 5 (pivot)  |  Status: FINAL
> Stack: Nuxt 2 / Vue 2 SPA, existing SCSS tokens (`_variables.scss`), Vuex classic modules.
> Do NOT introduce new UI frameworks. Use existing `$color-*`, `$spacing-*`, `$border-radius`
> tokens and the existing `.btn`, `.form-field`, `.modal` patterns from `AddItemModal.vue`.

---

## 0. Design principles for this pivot

1. **Honesty over false precision.** Every estimate must show its evidence base (N sales).
   When data is thin (sampleSize < 3), say so explicitly. Never show "$1,150" alone —
   always pair it with the range and the sample count.
2. **Comp-backed, not self-typed.** Users never enter a value for their own items.
   The number comes from the engine. The override exists but is opt-in and labeled as such.
3. **The deal check is a quick tool, not a wizard.** It lives on its own page but should
   feel as fast as a search box — enter three things, get an instant verdict.
4. **Log a sale is lightweight contribution.** It should feel like filling out a receipt,
   not a form. Five fields, submit, done.

---

## 1. New SCSS tokens (add to `_variables.scss`)

These are the only additions needed. No new framework.

```scss
// Valuation / semantic colors
$color-under-market:  #16a34a;   // green-600 — "under market" / good deal
$color-at-market:     #d97706;   // amber-600 — "at market" / fair
$color-over-market:   #dc2626;   // red-600   — "over market" / avoid
$color-low-conf:      #6b7280;   // same as $color-text-muted — low confidence
$color-low-conf-bg:   #f3f4f6;   // light gray bg for low-confidence banner

// Range badge
$color-range-bg:      #f0fdf4;   // green-50 tint for range pill background
$color-range-border:  #bbf7d0;   // green-200
```

Contrast check: `$color-under-market` (#16a34a) on white = 4.6:1 (passes AA for normal
text at 0.875rem bold). `$color-over-market` (#dc2626) on white = 4.5:1 (passes AA).

---

## 2. Computed value display

### 2a. ItemCard.vue — card body changes

Replace the existing `.item-card__value` block (which showed `item.currentValue`) with the
`ValuationBadge` component (see section 2d). The card body becomes:

```
┌──────────────────────────────────────────┐
│ [photo 4:3]                              │
├──────────────────────────────────────────┤
│ Leica M3                     [Excellent] │  ← __name + condition pill
│ S/N: 891234                              │  ← __meta (unchanged)
│                                          │
│ ~ $1,150                                 │  ← __estimate  (font-size 1.1rem, bold, $color-accent)
│ $950 – $1,400  · 14 sales               │  ← __range     (font-size 0.75rem, $color-text-muted)
└──────────────────────────────────────────┘
```

States on the card:

```
NORMAL (sampleSize >= 3):
  ~ $1,150
  $950 – $1,400  ·  14 sales

LOW-CONFIDENCE (sampleSize 1–2):
  ~ $420  ⚠ limited data
  $310 – $550  ·  2 sales

NO-DATA (estimatedValue absent, no override):
  No estimate yet
  [gray text, $color-text-muted]

USER-OVERRIDE (userOverrideValue present):
  $1,100  (your estimate)
  [no range shown; $color-text-muted italic label]
```

The condition badge is a `<span>` pill using inline SCSS (not a new component):

```scss
.condition-pill {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 99px;
  background: $color-bg;
  border: 1px solid $color-border;
  color: $color-text-muted;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
```

### 2b. Item detail page — valuation block

Route: `/items/{itemId}`. The valuation block sits between the photo carousel and the
notes field.

```
┌────────────────────────────────────────────────────────────┐
│  MARKET ESTIMATE                                           │
│  ─────────────────────────────────────────────────────     │
│                                                            │
│  ~ $1,150                  [ $950 – $1,400 ]              │
│    point estimate              range badge (pill)          │
│                                                            │
│  Based on 14 recent sales  ·  as of Jun 13, 2026          │
│  [gray 0.8rem]                                    [Refresh]│
│                                                            │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─     │
│  Override estimate (optional)                              │
│  [number input]  [Save override btn]                       │
│  Use if you have a recent appraisal or private sale.       │
└────────────────────────────────────────────────────────────┘
```

**"Refresh estimate" button** (the [Refresh] label above, `btn--ghost` small): calls
`GET /api/valuation?make=&model=&condition=` with the item's values, then writes the
returned `{ estimate, low, high, sampleSize, asOf }` into the item doc's `estimatedValue`
field via the Firestore web SDK. Shows an inline spinner while loading; replaces the
as-of date on success. This is the primary mechanism for DoD #4 verification (log a
sale → click Refresh on the item → estimate shifts).

LOW-CONFIDENCE variant (sampleSize < 3):

```
┌────────────────────────────────────────────────────────────┐
│  MARKET ESTIMATE                                           │
│  ─────────────────────────────────────────────────────     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚠  Limited data — only 2 sales found for this      │   │
│  │    model. Treat this as a rough guide only.         │   │
│  │    [Log a sale to help improve this estimate →]     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ~ $420                    [ $310 – $550 ]                │
│  Based on 2 recent sales  ·  as of Jun 13, 2026           │
└────────────────────────────────────────────────────────────┘
```

The low-confidence banner uses `$color-low-conf-bg` background, `$color-low-conf` text,
and `border-left: 3px solid $color-at-market` (amber). "Log a sale" link opens the
LogSaleModal.

NO-DATA variant:

```
┌────────────────────────────────────────────────────────────┐
│  MARKET ESTIMATE                                           │
│  ─────────────────────────────────────────────────────     │
│  No sales data found for this model yet.                   │
│  Be the first to log a sale →  [Log a Sale]               │
│                                                            │
│  You can also add your own estimate below:                 │
│  [number input]  [Save override btn]                       │
└────────────────────────────────────────────────────────────┘
```

### 2c. Add-item modal — valuation preview block

This block appears inside the existing `AddItemModal.vue` form, after the condition
field and before the serial/purchase-price row. It is triggered client-side when all of
make, model, and condition are non-empty (debounce 600ms to avoid hammering the API).

```
┌──────────────────────────────────────────────────────────┐
│  Market Estimate                                         │
│  ───────────────────────────────────────────────────     │
│                                                          │
│  [IDLE — fields not yet complete]                        │
│  Enter make, model, and condition to see an estimate.    │
│  [gray italic 0.8rem]                                    │
│                                                          │
│  [LOADING]                                               │
│  Checking recent sales…  [inline spinner]                │
│                                                          │
│  [NORMAL]                                                │
│  ~ $1,150          $950 – $1,400 range                   │
│  Based on 14 recent sales                                │
│                                                          │
│  [LOW-CONFIDENCE]                                        │
│  ~ $420   ⚠ limited data (2 sales)                      │
│  $310 – $550 range — treat as rough guide                │
│                                                          │
│  [NO-DATA]                                               │
│  No sales data yet for this model.                       │
│  We'll track it as the dataset grows. You can add an     │
│  override value after saving.                            │
│                                                          │
│  [ERROR]                                                 │
│  Could not load estimate — check your connection.        │
│  You can save the item and check back later.             │
└──────────────────────────────────────────────────────────┘
```

The block uses existing `.form-field` wrapper styles. It does NOT block form submission
— the user can save with no estimate (model will have null `estimatedValue`).

Implementation notes for frontend:
- Vuex action `items/fetchValuationPreview({ make, model, condition })` → hits
  `GET /api/valuation?make=&model=&condition=` → stores result in
  `items.valuationPreview` (`{ estimate, low, high, sampleSize, asOf } | null`).
- When the user submits the form, the `valuationPreview` result (if available) is
  included in the item doc written to Firestore via the web SDK as `estimatedValue`.
  If the preview fetch failed or returned no-data, `estimatedValue` is written as
  `null`; the user can refresh it later from the item detail page.
- Component-local `valuationState`: `'idle' | 'loading' | 'ready' | 'low-confidence' |
  'no-data' | 'error'`.
- `low-confidence` = `sampleSize > 0 && sampleSize < 3`.
- `no-data` = `sampleSize === 0` or server returns 404/empty.

### 2d. ValuationBadge — shared inline component

Used on ItemCard and anywhere else a compact estimate+range needs to appear. Implemented
as a presentational component `components/ValuationBadge.vue` (no Vuex, props only).

Props:
```js
props: {
  estimate:    { type: Number, default: null },
  low:         { type: Number, default: null },
  high:        { type: Number, default: null },
  sampleSize:  { type: Number, default: 0 },
  override:    { type: Number, default: null },  // userOverrideValue
  compact:     { type: Boolean, default: false }, // card vs. detail layout
}
```

---

## 3. Living portfolio — gallery header

File: `pages/index.vue`, `.summary-card` block.

**Label change:** "Total Collection Value" → "Market Value (comp-backed)"

**Sub-label (new):** Below the dollar amount, one line of muted text:
`"Estimated from recent sales · [N] items valued"` where N is the count of items that
have a non-null effectiveValue.

If some items have no estimate yet:
`"[M] of [total] items estimated · [K] awaiting data"`

```
┌─────────────────────────────────────────────────────┐
│  Market Value (comp-backed)         Items           │
│  $3,420                             4               │
│  Estimated from recent sales                        │
│  3 of 4 items valued · 1 awaiting data              │
└─────────────────────────────────────────────────────┘
```

The total itself must use the `effectiveValue` getter in `store/items.js`:
```
effectiveValue per item = item.userOverrideValue ?? item.estimatedValue?.estimate ?? 0
totalValue = items.reduce((sum, item) => sum + effectiveValue(item), 0)
```

The existing `totalValue` Vuex getter is updated to this formula; `sampleSize` context is
a computed property on the page.

---

## 4. Deal check page

### Route: `/deal-check`

New page. Nav link in the gallery header ("Deal Check" button, same row as "+ Add Item").
Accessible to any authed user. No item-save; it is a stateless lookup tool.

### Information architecture

```
/deal-check
  ├── Form: make / model / condition / asking price
  ├── Verdict block (appears after form submit)
  │     ├── under / at / over market badge
  │     ├── comp range + sample size
  │     ├── low-confidence or no-data state
  │     └── "Log a sale" CTA
  └── (Post-POC: recent comps list, price history chart)
```

### Page wireframe

```
┌──────────────────────────────────────────────────────────────┐
│  Deal Check                                                  │
│  Is this listing worth the price?                            │
│──────────────────────────────────────────────────────────────│
│                                                              │
│  Make         [text input           ]                        │
│  Model        [text input           ]                        │
│  Condition    [select: Mint/Exc/Good/Fair/Poor]              │
│  Asking price [number input, USD    ]                        │
│                                                              │
│  [  Check Deal  ]  btn--primary                              │
│                                                              │
│──────────────────────────────────────────────────────────────│
│  VERDICT (shown after submit)                                │
│                                                              │
│  ┌─ UNDER MARKET ──────────────────────────────────────────┐ │
│  │  Asking: $750   Range: $950 – $1,400  Estimate: $1,150  │ │
│  │  This asking price is 35% below the estimated market    │ │
│  │  value. Based on 14 recent sales.                       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ AT MARKET ─────────────────────────────────────────────┐ │
│  │  Asking: $1,100  Range: $950 – $1,400  Est.: $1,150     │ │
│  │  Asking price is within the expected market range.      │ │
│  │  Based on 14 recent sales.                              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─ OVER MARKET ───────────────────────────────────────────┐ │
│  │  Asking: $1,800  Range: $950 – $1,400  Est.: $1,150     │ │
│  │  This asking price is 57% above the estimated market    │ │
│  │  value. Proceed with caution.                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Know the actual sale price?  Log a Sale →]                 │
└──────────────────────────────────────────────────────────────┘
```

### Verdict thresholds (UX-level — valuation engine enforces)

| Condition | Verdict |
|---|---|
| asking < low × 0.90 | UNDER MARKET (green) |
| asking >= low × 0.90 AND asking <= high × 1.10 | AT MARKET (amber) |
| asking > high × 1.10 | OVER MARKET (red) |

Rationale: the 10% cushion on each side acknowledges that the range itself has variance;
a listing $50 outside the 80th-percentile is not necessarily a bad deal. The thresholds
are intentionally conservative. The backend `POST /api/deal-check` performs this
calculation and returns `{ verdict: 'under' | 'at' | 'over', pctDiff, estimate, low,
high, sampleSize }`.

### States

- **Idle:** form only, no verdict block visible.
- **Loading:** "Check Deal" button shows inline spinner and is disabled.
- **Verdict:** verdict block replaces (or appears below) the form. Verdict badge:
  `.verdict-badge--under` / `--at` / `--over` using the semantic color tokens.
- **Low-confidence:** verdict shown with amber "⚠ limited data" banner above it.
  Thresholds still applied; user is warned to treat the result with caution.
- **No-data:** "No sales data found for this model yet. Help build the dataset by
  logging a sale." No verdict badge. [Log a Sale] CTA.
- **Error:** "Could not retrieve market data. Please try again." Inline below the button.

### Verdict badge SCSS pattern

```scss
.verdict-badge {
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius;
  font-weight: 700;
  font-size: 0.875rem;
  display: inline-block;

  &--under {
    background: lighten($color-under-market, 52%);
    color: $color-under-market;
    border: 1px solid lighten($color-under-market, 35%);
  }
  &--at {
    background: lighten($color-at-market, 45%);
    color: $color-at-market;
    border: 1px solid lighten($color-at-market, 25%);
  }
  &--over {
    background: lighten($color-over-market, 48%);
    color: $color-over-market;
    border: 1px solid lighten($color-over-market, 30%);
  }
}
```

### Vuex / API wiring

- Store module: `store/dealCheck.js` — `state: { loading, result, error }`.
- Action `dealCheck/check({ make, model, condition, askingPrice })` → POST
  `/api/deal-check` → commits result.
- The page is a thin wrapper: form → dispatch → render result.

---

## 5. Log a Sale flow

### Entry points

- "Log a Sale" link/button in the deal-check verdict block.
- "Log a sale" link in the low-confidence/no-data banners on item detail.
- "+ Log a Sale" in the gallery header actions (secondary, `btn--ghost`).
- All entry points open `LogSaleModal.vue` (follows the same `modal-overlay` / `modal`
  pattern as `AddItemModal.vue`).

### Modal wireframe

```
┌──────────────────────────────────────────────────────────┐
│  Log a Sale                                    [×]       │
│──────────────────────────────────────────────────────────│
│                                                          │
│  Help improve estimates by sharing a real sale price.    │
│  Your user ID is attached but never shown publicly.      │
│                                                          │
│  Make          [text input, required          ]          │
│  Model         [text input, required          ]          │
│  Condition     [select, required              ]          │
│  Sale price    [number input, USD, required   ]          │
│  Sale date     [date input, required          ]          │
│  Source        [select: eBay / KEH / Local sale /        │
│                          Auction / Other ]               │
│                                                          │
│  [Cancel]                           [Submit Sale]        │
│──────────────────────────────────────────────────────────│
│  [SUCCESS STATE — replaces form]                         │
│                                                          │
│  Sale logged. Thank you!                                 │
│  This data joins our comp pool and will improve          │
│  estimates for this model.                               │
│                                                          │
│                               [Close]                    │
└──────────────────────────────────────────────────────────┘
```

### Form fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `make` | text | yes | Pre-filled if opened from an item/deal-check context |
| `model` | text | yes | Pre-filled if context available |
| `condition` | select | yes | Mint / Excellent / Good / Fair / Poor |
| `salePrice` | number | yes | USD, min 0, 2 decimal places |
| `saleDate` | date | yes | Must not be in the future |
| `source` | select | yes | eBay / KEH / Local sale / Auction / Other |

### States

- **Idle:** form.
- **Loading:** Submit button shows spinner, is disabled.
- **Success:** Form replaced by the success message above. Modal can be closed.
- **Error:** Inline error below the form: "Could not submit sale. Please try again."

### What happens on submit

1. Vuex action `comps/logSale(formData)` dispatched.
2. Action calls `POST /api/comps` with the form payload.
3. Server writes `comps/{compId}` with `contributedBy: uid`, `status: 'user-submitted'`,
   `createdAt: serverTimestamp()`.
4. The comp is immediately available in the `comps` collection (no moderation gate for
   POC; moderation is post-POC).
5. On success: store commits `comps/SET_SALE_SUCCESS true`; modal shows success state.
6. The user's item (if any) is NOT automatically re-valued when a sale is logged.
   Re-valuation is on-demand: the user visits the item detail page and clicks "Refresh
   estimate", which calls `GET /api/valuation` and writes the updated `estimatedValue`
   to Firestore via the web SDK. The success message sets the right expectation:
   "This data joins our comp pool and will improve estimates for this model."
   Automatic re-valuation on a schedule is post-POC.

### Comps Firestore document shape (written by server)

```json
{
  "make": "Leica",
  "model": "M3",
  "modelKey": "leica_m3",
  "condition": "Excellent",
  "salePrice": 1050.00,
  "saleDate": "2026-05-20",
  "source": "eBay",
  "contributedBy": "<uid>",
  "status": "user-submitted",
  "createdAt": "<Timestamp>"
}
```

---

## 6. Watchlist — POST-POC (not in this build)

> **Out of scope for the pivot POC** (see `PRODUCT_BRIEF.md` Out-of-scope and `BACKLOG.md`
> Later). A watchlist's real value is inbound listing alerts, which require a listing feed we
> don't have; the page-load Deal Check (§5) covers the POC buyer use case. Do **not** build a
> `/watchlist` page, `store/watchlist.js`, or a "Watch a Model" modal in cycle 5. This section
> is a placeholder to record the deferral; the UX will be specced when the feature is greenlit.

---

## 7. Insurance export — comp evidence line

The existing export flow (`store/items.js → exportInsurance action → GET /api/export`)
remains unchanged at the routing/trigger level. The server-side template
(`product/server/lib/exportTemplate.js`) adds a comp evidence line per item.

### Per-item export line format

Old format:
```
Nikon F3  |  Excellent  |  $420.00
```

New format:
```
Nikon F3                    Condition: Excellent
  Purchase Price: $350.00   Purchase Date: 2022-04-10
  Estimated Market Value: $420.00
  (comp-backed; based on 8 recent sales as of 2026-06-13; range $310–$530)
  [User override applied]  ← only shown when userOverrideValue is present
```

If `estimatedValue` is absent and no override:
```
  Estimated Market Value: Not yet valued
  (add comp data for this model to generate an estimate)
```

This evidence line makes the export more credible to an insurance adjuster because
it shows provenance (how the number was arrived at), not just a self-asserted value.

---

## 8. Navigation changes

Current nav (gallery header): `+ Add Item` | `Export for Insurance` | `Sign Out`

New nav (gallery header):
```
[Vault]  ← brand
                    [+ Add Item] [+ Log a Sale] [Deal Check] [Export] [Sign Out]
```

- "Deal Check" → navigates to `/deal-check`.
- "+ Log a Sale" → opens `LogSaleModal.vue`.
- The nav fits on a single row at 1100px max-width; at narrow widths the secondary
  actions (Log a Sale, Deal Check, Export, Sign Out) collapse to a "More" overflow menu
  (post-POC; for POC, wrap to a second line is acceptable since this is a desktop-first
  tool at POC stage).

---

## 9. Flash messages / error logging

The app uses `createLog` for every `catch` block (server + client) and shows flash
messages for user-visible errors. No change to that pattern. The new screens add:

| Trigger | Flash message |
|---|---|
| `logSale` fails | "Could not submit sale. Please try again." |
| `dealCheck` fails | "Could not retrieve market data. Please try again." |
| `valuationPreview` fails (modal) | "Could not load estimate — you can save the item and check back later." (inline, not a flash) |

Valuation preview failures are inline (inside the modal block) because they should not
block the add-item flow. All other failures use the existing flash/toast pattern.

---

## 10. Accessibility checklist (for frontend review)

- All new form inputs have an associated `<label for="...">` (same pattern as
  `AddItemModal.vue`).
- Verdict badge color is never the sole indicator — always paired with text label
  ("UNDER MARKET", "AT MARKET", "OVER MARKET").
- `⚠` warning character has `aria-label="Warning:"` on its containing element.
- Modal focus trap: same `aria-modal="true"` + `aria-labelledby` pattern as the
  existing `AddItemModal`.
- `LogSaleModal.vue` must trap focus on open (follow `AddItemModal` exactly).
- Range badge and sample size text must not be hidden from screen readers.

---

## 11. POC DoD alignment

| DoD item | Screen(s) / component(s) specified in this doc |
|---|---|
| 1. Computed value on add | Add-item modal — valuation preview block (§2c) |
| 2. Living portfolio total | Gallery header (§3) + `effectiveValue` getter |
| 3. Deal check verdict | `/deal-check` page (§4) |
| 4. Crowd loop shifts estimates | `LogSaleModal.vue` (§5) |
| 5. Insurance export comp evidence | Export line format (§7) |
| 6. Quality gate | Accessible markup (§10); SCSS tokens (§1) |

---

## 12. Files the frontend engineer will create or modify

| File | Action | Notes |
|---|---|---|
| `assets/styles/_variables.scss` | Modify | Add 6 new tokens (§1) |
| `components/ItemCard.vue` | Modify | Replace `currentValue` with estimate block |
| `components/ValuationBadge.vue` | Create | Shared presentational component |
| `components/AddItemModal.vue` | Modify | Remove `currentValue` field; add valuation preview block |
| `components/LogSaleModal.vue` | Create | Log a sale modal (§5) |
| `pages/index.vue` | Modify | Header label + sub-label; nav additions |
| `pages/deal-check.vue` | Create | Deal check page (§4) |
| `store/items.js` | Modify | Update `totalValue` getter; add `valuationPreview` state+action |
| `store/dealCheck.js` | Create | Deal check state + action |
| `store/comps.js` | Create | `logSale` action |
