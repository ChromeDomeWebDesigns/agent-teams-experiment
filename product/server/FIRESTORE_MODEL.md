# Firestore Data Model

Authoritative reference for all agents. The Firestore security rules at `firestore.rules`
(repo root) enforce these constraints.

---

## Collection: `items/{itemId}`

Owner-scoped. Each document belongs to exactly one authenticated user.

| Field           | Type           | Notes                                                              |
| --------------- | -------------- | ------------------------------------------------------------------ |
| `id`            | string         | Document ID (also stored in the document body)                     |
| `userId`        | string         | Firebase Auth UID of the owner — enforced by security rules        |
| `category`      | string         | e.g. `'camera'`                                                    |
| `make`          | string         | Manufacturer name                                                  |
| `model`         | string         | Model name                                                         |
| `serial`        | string         | Serial number                                                      |
| `condition`     | string         | e.g. `'excellent'`, `'good'`, `'fair'`                             |
| `purchasePrice` | number         | Original purchase price (USD)                                      |
| `purchaseDate`  | string         | ISO 8601 date string (`YYYY-MM-DD`)                                |
| `currentValue`  | number         | Current estimated value (USD)                                      |
| `photoPath`     | string \| null | Firebase Storage path — `users/{userId}/items/{itemId}/<filename>` |
| `createdAt`     | timestamp      | `serverTimestamp()` on create                                      |
| `updatedAt`     | timestamp      | `serverTimestamp()` on every update                                |

### Security rules summary

- **create:** allowed only when `request.resource.data.userId == request.auth.uid`
- **read / update / delete:** allowed only when `resource.data.userId == request.auth.uid`
- All other access denied.

---

## Subcollection: `items/{itemId}/valuations/{valId}`

Append-only valuation history for an item. Stored under the parent item for locality.

| Field   | Type      | Notes                                               |
| ------- | --------- | --------------------------------------------------- |
| `id`    | string    | Document ID                                         |
| `value` | number    | Estimated value at the time of the entry (USD)      |
| `at`    | timestamp | `serverTimestamp()` when the valuation was recorded |

### Security rules summary

- All operations require `request.auth.uid == items/{itemId}.userId` (parent-item lookup).

---

## Storage

Item photos are stored at:

```
users/{userId}/items/{itemId}/<filename>
```

- A user may read and write only within their own `users/{uid}/` prefix.
- `photoPath` on the `items` document holds the full Storage path string.

---

## Collection: `logs/{id}`

Append-only audit log written by `lib/logger.js` (server) and the client logger.

| Field       | Type      | Notes                                          |
| ----------- | --------- | ---------------------------------------------- |
| `id`        | string    | uuid-v4, stored as the doc ID and in the body  |
| `logType`   | string    | `'CLIENT'` or `'SERVER'`                       |
| `message`   | string    | Human-readable log message                     |
| `severity`  | string    | `'DEBUG'`, `'INFO'`, `'WARNING'`, or `'ERROR'` |
| `addlData`  | object    | Arbitrary additional context                   |
| `createdAt` | timestamp | `serverTimestamp()`                            |

### Security rules summary

- Authed users may **create** only.
- **read / update / delete** are denied for all callers (including the owner).
