# Procurement Queue

> How the team gets things it can't self-serve (API keys, paid accounts, domains, etc.).
>
> 1. A teammate appends a request below (status `REQUESTED`) and adds the env-var NAME to
>    `.env.example`.
> 2. The CEO notifies the human and parks the blocked task.
> 3. The human provisions it, puts the value in `.env` (gitignored), and sets status `FULFILLED`.
> 4. The task unblocks next cycle.
>
> NEVER put secret values in this file — names and descriptions only.

| Date | Env var name | What / why | Requested by | Status |
|---|---|---|---|---|
| 2026-06-12 | `FIREBASE_*` (client config) | Firebase project web config for the client app (auth + Firestore + Storage). Free Spark tier is fine for v1. | CEO | REQUESTED |
| 2026-06-12 | `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to a Firebase service-account JSON (kept OUTSIDE the repo) for the Express server's Admin SDK. | CEO | REQUESTED |

> Needed only once building starts (cycle 1), not before approval. To provision: create a
> Firebase project, enable Auth + Firestore + Storage, copy the web config into `.env`, and
> download a service-account key to a path outside the repo, then set
> `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env`.
