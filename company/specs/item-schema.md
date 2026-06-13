# Spec: Item Data Model + Add-Item Flow

> Owner: PM / design  |  Cycle: 2  |  Status: FINAL

---

## Problem / context

The core Vault loop is: add a camera/lens item → view collection → export for insurance.
This spec defines the Firestore data shape and the add-item + gallery UI flow so that
backend and frontend can build independently without ambiguity.

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
| `serial` | string | no | Serial number as printed on the body |
| `condition` | string (enum) | yes | One of: `Mint`, `Excellent`, `Good`, `Fair`, `Poor` |
| `purchasePrice` | number | yes | In USD (no currency conversion for POC) |
| `purchaseDate` | string (ISO date) | yes | `YYYY-MM-DD` — stored as string for simplicity |
| `currentValue` | number | yes | Manually entered by user; no automated feed |
| `photoUrls` | array of strings | yes (min 1) | Firebase Storage download URLs |
| `notes` | string | no | Free-text; max 1000 chars |
| `createdAt` | Firestore Timestamp | yes | Set by server via `serverTimestamp()` on create |
| `updatedAt` | Firestore Timestamp | yes | Updated by server via `serverTimestamp()` on every write |

All monetary fields are plain numbers (USD cents not used; display with 2 decimal places).

### Example document

```json
{
  "make": "Nikon",
  "model": "F3",
  "serial": "1234567",
  "condition": "Excellent",
  "purchasePrice": 350.00,
  "purchaseDate": "2023-08-15",
  "currentValue": 420.00,
  "photoUrls": [
    "https://firebasestorage.googleapis.com/..."
  ],
  "notes": "Purchased from KEH. HP finder. Minor brassing on top plate.",
  "createdAt": "<Timestamp>",
  "updatedAt": "<Timestamp>"
}
```

### Security rules (summary — backend to implement)

- A user can only read/write documents inside `users/{userId}/items/**` where
  `userId == request.auth.uid`.
- Unauthenticated requests are denied entirely.
- No user can read or write another user's items.

---

## Add-item form flow

### Entry point

- Nav bar "Add Item" button (visible only when logged in).
- Route: `/items/new`

### Form fields (in display order)

1. **Make** — text input, required, placeholder "e.g. Nikon"
2. **Model** — text input, required, placeholder "e.g. F3"
3. **Serial number** — text input, optional, placeholder "e.g. 1234567"
4. **Condition** — select/radio, required, options: Mint / Excellent / Good / Fair / Poor
5. **Purchase price (USD)** — number input, required, min 0, 2 decimal places
6. **Purchase date** — date picker (or `<input type="date">`), required
7. **Current value (USD)** — number input, required, min 0, 2 decimal places;
   label note: "Your estimate — no market feed yet"
8. **Photos** — file input, accepts image/*, required (at least 1);
   show thumbnail previews before submit
9. **Notes** — textarea, optional, max 1000 chars

### Validation (client-side, before submit)

- Required fields are non-empty.
- Prices are non-negative numbers.
- At least one photo is selected.
- Submit button is disabled while upload/save is in progress.

### Submit sequence

1. Upload photo file(s) to Firebase Storage under `users/{userId}/{itemId}/{filename}`.
2. Collect the resulting download URL(s).
3. Write the item document to `users/{userId}/items/{itemId}` via Firestore web SDK.
4. On success: redirect to the gallery (`/items`).
5. On error: display an inline error message; keep form data intact so the user can retry.

---

## Gallery / collection view flow

### Route: `/items`

- Guarded: redirect to `/login` if not authenticated.
- Reads `users/{userId}/items` ordered by `createdAt` descending.
- Displays items as cards (photo thumbnail, make + model, condition badge, current value).
- Header shows **Total collection value** = sum of all `currentValue` fields.
- Empty state: "No items yet — add your first camera or lens."

### Card actions (POC scope)

- Click card → item detail view (read-only for POC; edit is post-POC).
- "Export for insurance" button in the gallery header → triggers the export flow (cycle 3).

### Item detail view

- Route: `/items/{itemId}`
- Displays all fields. Photo(s) shown full-width or in a small carousel.
- No edit/delete for POC (scope is tight; add-only is sufficient to validate the thesis).

---

## Out of scope for POC

- Edit / delete item.
- Valuation history log (timestamped value entries over time).
- Multiple currencies.
- Sorting / filtering the gallery beyond default (newest first).
- Bulk import.
