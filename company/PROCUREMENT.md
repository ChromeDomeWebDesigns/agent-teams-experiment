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
| 2026-06-12 | `NUXT_ENV_FIREBASE_*` (client config) | Firebase web config for the client (auth + Firestore + Storage). | CEO | ✅ FULFILLED 2026-06-13 |
| 2026-06-12 | `FIREBASE_SERVICE_ACCOUNT_PATH` | Service-account JSON (outside the repo) for the Express Admin SDK. | CEO | ✅ FULFILLED 2026-06-13 |

> ✅ **Firebase is fully provisioned and verified** (project `agent-teams-experiment`): all
> `NUXT_ENV_FIREBASE_*` web-config values + `FIREBASE_SERVICE_ACCOUNT_PATH` + `JWT_SECRET`
> are in `.env`, and a **live admin Firestore read succeeded** (2026-06-13). No procurement
> blockers remain — **do NOT treat Firebase as blocked.**
