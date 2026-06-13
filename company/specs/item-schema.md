# Spec: Item Data Model + Add-Item Flow

> Owner: PM / design  |  Cycle: 5 (pivot)  |  Status: FINAL (supersedes cycle-2 version)

---

## Problem / context

The market-aware collection loop is: add a camera/lens item → comps engine returns a
computed estimate + range → view collection with living total → export for insurance with
comp evidence → deal-check any listing → log a real sale back into the comp pool.

This spec defines the Firestore item data shape and the add-item + gallery UI flow after
the ADR-0006 pivot. The manual `currentValue` field is replaced by an `estimatedValue` block fetched from
the read-only `GET /api/valuation` endpoint and written to Firestore by the client,
plus an optional user override. The `comps` collection shape and valuation engine live in the backend spec /
`valuation-deal-ux.md`; this file covers the item document only.

---

## Firestore data model

### Collection path

```
users/{userId}/items/{itemId}
```

Items are scoped strictly to the authenticated user. No top-level `items` collection.

### Item document fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `make` | string | yes | e.g. "Nikon", "Canon", "Leica" |
| `model` | string | yes | e.g. "F3", "AE-1", "M6" |
| `modelKey` | string | yes | Normalized key for comp matching: `make_model` lowercased, spaces → underscores, e.g. `leica_m3`. Computed client-side before the Firestore write (same normalization the server applies). |
| `serial` | string | no | Serial number as printed on the body |
| `condition` | string (enum) | yes | One of: `Mint`, `Excellent`, `Good`, `Fair`, `Poor` |
| `purchasePrice` | number | no | In USD. Optional — some items are inherited/gifted. |
| `purchaseDate` | string (ISO date) | no | `YYYY-MM-DD` — stored as string for simplicity |
| `estimatedValue` | object | no | Returned by `GET /api/valuation` and written by the client into the item doc via the Firestore web SDK. Absent until the first valuation fetch. |
| `estimatedValue.estimate` | number | — | Point estimate in USD (median of matching comps after condition adjustment) |
| `estimatedValue.low` | number | — | 20th-percentile of the comp distribution |
| `estimatedValue.high` | number | — | 80th-percentile of the comp distribution |
| `estimatedValue.sampleSize` | number | — | Number of matching comps used |
| `estimatedValue.asOf` | string (ISO date) | — | Date of the valuation run (`YYYY-MM-DD`) |
| `userOverrideValue` | number | no | User-supplied override; if present, used instead of `estimatedValue.estimate` for portfolio total and export. |
| `photoUrls` | array of strings | yes (min 1) | Firebase Storage download URLs |
| `notes` | string | no | Free-text; max 1000 chars |
| `createdAt` | Firestore Timestamp | yes | Set by server via `serverTimestamp()` on create |
| `updatedAt` | Firestore Timestamp | yes | Updated by server via `serverTimestamp()` on every write |

**REMOVED from the old model:** `currentValue` (was manually entered). Replaced by
`estimatedValue` (computed) + `userOverrideValue` (optional override).

All monetary fields are plain numbers (USD; display with `toLocaleString()` / 2 decimal
places). No currency conversion for POC.

### Effective value rule (used by store getter + export)

```
effectiveValue = userOverrideValue ?? estimatedValue.estimate ?? null
```

If `effectiveValue` is `null` (comps unavailable + no override), the item contributes $0
to the portfolio total and shows the "no data" state.

### Example document

```json
{
  "make": "Leica",
  "model": "M3",
  "modelKey": "leica_m3",
  "serial": "891234",
  "condition": "Excellent",
  "purchasePrice": 900.00,
  "purchaseDate": "2022-04-10",
  "estimatedValue": {
    "estimate": 1150.00,
    "low": 950.00,
    "high": 1400.00,
    "sampleSize": 14,
    "asOf": "2026-06-13"
  },
  "userOverrideValue": null,
  "photoUrls": [
    "https://firebasestorage.googleapis.com/..."
  ],
  "notes": "Double stroke. Repainted vulcanite.",
  "createdAt": "<Timestamp>",
  "updatedAt": "<Timestamp>"
}
```

### Security rules (summary — backend to implement)

- A user can only read/write documents inside `users/{userId}/items/**` where
  `userId == request.auth.uid`. Unchanged from cycle 2.
- Unauthenticated requests are denied entirely.
- No user can read or write another user's items.
- The client fetches `estimatedValue` from `GET /api/valuation` (read-only, no auth
  side-effects) and writes it into the item doc via the Firestore web SDK along with all
  other item fields. This preserves the existing per-user rules and emulator tests.
- The client may also write `userOverrideValue` to its own item document at any time.

---

## Add-item form flow

### Entry point

- "+ Add Item" button in the gallery header (visible only when logged in).
- Implemented as `AddItemModal.vue` (modal overlay, not a separate route).

### Form fields (in display order)

1. **Make** — text input, required, placeholder "e.g. Nikon"
2. **Model** — text input, required, placeholder "e.g. F3"
3. **Condition** — select, required, options: Mint / Excellent / Good / Fair / Poor
4. **Serial number** — text input, optional, placeholder "e.g. 1234567"
5. **Purchase price (USD)** — number input, optional, min 0, 2 decimal places;
   label note: "What you paid — optional"
6. **Purchase date** — `<input type="date">`, optional
7. **Photos** — file input, accepts image/\*, required (at least 1);
   show filename hint after selection
8. **Notes** — textarea, optional, max 1000 chars

**REMOVED:** "Current value (USD)" field. The value is now computed, not typed.

**NEW — Valuation preview block** (appears after make + model + condition are all
non-empty, triggered by a `GET /api/valuation?make=&model=&condition=` call):

```
┌─────────────────────────────────────────────────────┐
│  Market Estimate                                    │
│                                                     │
│  [loading state]  Checking recent sales…            │
│                                                     │
│  [normal state]   ~ $1,150     $950 – $1,400 range  │
│                   Based on 14 recent sales          │
│                                                     │
│  [low-confidence] ~ $420       $310 – $550 range    │
│                   Limited data (2 sales) — treat    │
│                   as a rough guide only             │
│                                                     │
│  [no-data state]  No sales data yet for this model. │
│                   You can add an override value     │
│                   below or skip.                    │
└─────────────────────────────────────────────────────┘
```

The valuation preview block is read-only in the add flow. The user override input
appears only in the no-data state (and on the item detail view post-save).

### Validation (client-side, before submit)

- Make, model, condition are non-empty.
- At least one photo is selected.
- Purchase price, if entered, is a non-negative number.
- Submit button is disabled while upload/save is in progress.
- Purchase price and date are now both optional (some items are gifts or inherited).

### Submit sequence

1. Client computes `modelKey` from make + model (lowercase, spaces → underscores).
2. If the valuation preview block already fetched a result, that `estimatedValue` object
   is ready to include in the write. If the fetch is still in progress, wait for it to
   resolve (or timeout after 3 s and proceed with `estimatedValue: null`).
3. Upload photo file(s) to Firebase Storage under `users/{userId}/{itemId}/{filename}`.
4. Collect the resulting download URL(s).
5. Write the item document directly to `users/{userId}/items/{itemId}` via the Firestore
   web SDK (same path as today), including `modelKey` and `estimatedValue` (or `null`).
   This preserves the existing per-user security rules and all emulator tests.
6. On success: emit `saved` event → modal closes; gallery re-fetches items.
7. On error: display inline error message (`item-form__error`); keep form data intact.

---

## Gallery / collection view flow

### Route: `/` (index page, `pages/index.vue`)

- Guarded: redirect to `/login` if not authenticated.
- Reads `users/{userId}/items` ordered by `createdAt` descending.
- Displays items as cards (photo thumbnail, make + model, condition badge,
  **computed estimate + range badge**).
- Header summary shows:
  - **Total Market Value** = sum of `effectiveValue` across all items (comp-backed; uses
    override if present). Label: "Market Value (comp-backed)" to distinguish it from the
    old hand-typed total.
  - **Items** count (unchanged).
- Empty state: "No items yet — add your first camera or lens." (unchanged)

### Card changes (ItemCard.vue)

- Replace `item.currentValue` display with the estimate + range badge. See
  `valuation-deal-ux.md` for the full card wireframe and states.

### Item detail view

- Route: `/items/{itemId}`
- Displays all fields including the full valuation block (estimate, range, sample size,
  as-of date) and the user override input.
- No edit/delete for POC (add-only).

---

## Out of scope for POC

- Edit / delete item.
- Valuation history log (timestamped value snapshots over time).
- Multiple currencies.
- Sorting / filtering the gallery beyond default (newest first).
- Bulk import.
- Automatic re-valuation on a schedule (post-POC). For POC, re-valuation is on-demand
  via the "Refresh estimate" button on the item detail page, which calls
  `GET /api/valuation` and updates `estimatedValue` in the item doc via the web SDK.
