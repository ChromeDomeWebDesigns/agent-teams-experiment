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
| — | — | _(none yet)_ | — | — |
