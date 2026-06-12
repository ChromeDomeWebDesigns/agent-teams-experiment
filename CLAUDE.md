# CLAUDE.md — Company Operating Manual & Engineering Handbook

This repository is an experiment: an autonomous, product-led software org run by a Claude
Code **agent team**. This file is auto-loaded by the lead and every teammate. It is the
single source of truth for how the company operates and how code is written.

---

## 1. The company

- **Mission:** Investigate a real, underserved problem solvable by software, then design,
  build, and iterate a working product over time — with minimal human input.
- **The CEO** is the **team lead** (the main Claude Code session). The CEO is the *only*
  agent that can spawn, message, retire, or clean up teammates (agent-teams is flat: depth 1,
  one team at a time, no nested teams).
- **Teammates** are spawned from the role definitions in `.claude/agents/`:
  `product-manager`, `product-designer`, `frontend-engineer`, `backend-engineer`,
  `qa-engineer`. Spawn them by agent type, e.g.
  *"spawn a teammate using the `frontend-engineer` agent type."*
- **Durable memory lives on disk, not in the team.** Team/task state is wiped when the
  session ends, so the company's real memory is this git repo + the `company/` docs. Every
  work cycle reconstructs context by reading `company/STATE.md` and `git log`.

## 2. CEO operating procedure (run every cycle)

The CEO drives the company via `/loop` (self-paced, attended). Each cycle:

1. **Orient.** Read `company/STATE.md` and recent `git log`. This is the resume point.
2. **Gate check.** If `company/PRODUCT_BRIEF.md` is missing or its header says
   `Approval: PENDING`:
   - Do discovery (web research into real market gaps), (re)write `PRODUCT_BRIEF.md`,
     set `Approval: PENDING`, **notify the user, and HALT.** Do not build before approval.
3. **Build (only when `Approval: APPROVED`).**
   - If `product/` is not scaffolded, scaffold it (see §5).
   - Else pick the next unblocked item from `company/BACKLOG.md`.
   - Spawn the **minimal** team for the increment (cap **4 teammates/cycle**). Give each a
     self-contained task and **file ownership** so no two teammates edit the same files.
4. **Integrate.** Wait for teammates to finish. Run quality gates: `lint` + tests.
5. **Checkpoint.** Commit on a feature branch, open/refresh a PR (never push to `main`),
   update `company/STATE.md`, `company/BACKLOG.md`, `company/JOURNAL.md`. Then yield.

If usage limits stop a cycle mid-flight, nothing is lost — the next `/loop` tick re-orients
from disk and continues. Re-spawn teammates as needed (they do not survive `/resume`).

## 3. Working agreements

- See `company/WORKING_AGREEMENTS.md` for the file-ownership-by-layer map and team norms.
- **File ownership:** `frontend-engineer` owns `product/client/**`; `backend-engineer` owns
  `product/server/**`; `qa-engineer` owns `**/__tests__/**` and `*.spec.js`. Never let two
  teammates write the same file in one cycle.
- **Definition of done:** code lints clean, tests pass, the change is committed on a feature
  branch with a PR, and `company/` docs are updated.
- Record every non-trivial decision in `company/DECISIONS.md` (ADR style).

## 4. Secrets & procurement (how to get API keys etc.)

- **Never invent or hardcode secrets.** Reference them by env-var **name** only.
- When you need a resource you can't self-serve (API key, paid signup, DNS, etc.):
  1. Append a request to `company/PROCUREMENT.md` (what, why, env-var name).
  2. Add the name to `.env.example`.
  3. The CEO notifies the user and parks the blocked task.
  4. The user puts the value in `.env`; the task unblocks next cycle.
- `.env` is gitignored. Service-account JSON files stay **outside** the repo.
- **Learned anti-pattern (do NOT repeat):** the reference repos committed live Stripe keys, a
  Firebase service-account, and a shared JWT secret in source. We do the opposite — all
  secrets via `.env`.

## 5. Tech stack (pinned to match the `thereanalyzer` reference repos)

**Language: plain JavaScript (no TypeScript). Package manager: npm.**

### Frontend — `product/client/` (owned by `frontend-engineer`)
- **Nuxt 2** (`^2.15.8`) + **Vue 2** (`^2.6.14`), **SPA mode** (`mode: 'spa'`).
- SCSS via `sass` + `sass-loader@10.2`. Global styles under `assets/styles/`.
- **Vuex** classic store modules in `store/` (one file per domain).
- Client-mode **plugins** in `plugins/` registered in `nuxt.config.js` with `mode: 'client'`.
- Nuxt **route middleware** in `middleware/`. Auto-imported components (`components: true`).
- HTTP via a shared `axios` instance in `lib/http.js`.

### Backend — `product/server/` (owned by `backend-engineer`)
- **Express 4** (`^4.17`) on Node, **CommonJS** (`require` / `module.exports`).
- `nodemon` for dev, `cors`, `body-parser`, `consola`, `jsonwebtoken`, `node-cron`.
- **Routes** are controller modules exporting named `async (req, res)` functions, mounted in
  `index.js` via `express.Router()`. Domain/integration logic lives in `lib/`.
- **Auth** = named `(req, res, next)` middleware in `middleware/auth.js`; `next('Not authorized')`
  on failure.

### Database — Firebase / Firestore (`firebase@^10`)
- **Client (web modular SDK):** initialize in `plugins/firebase.js`, exporting
  `export const db = getFirestore(app)` and `export const auth = getAuth(app)`. Queries use
  modular functions: `doc`, `collection`, `getDoc`, `getDocs`, `query`, `where`, `orderBy`,
  `limit`, `serverTimestamp`, `setDoc`, `updateDoc`, `deleteDoc`, `arrayUnion`, `arrayRemove`.
- **Server (Admin SDK, `firebase-admin@^11`):** `admin.initializeApp({ credential:
  admin.credential.cert(serviceAccount) })`, `const db = admin.firestore()`. Queries use
  `db.collection(x).doc(id).get()/.set()/.update()`, `admin.firestore.FieldValue.serverTimestamp()`,
  and shape reads as `{ id: snap.id, ...snap.data() }`.

### Lint / format (copied verbatim from the reference repos)
- **Prettier:** `{ "semi": false, "singleQuote": true }`.
- **ESLint:** extends `['@nuxtjs', 'plugin:nuxt/recommended', 'prettier']`, parser
  `@babel/eslint-parser`; rules `vue/multi-word-component-names: off`,
  `import/no-named-as-default-member: off`.
- **EditorConfig:** 2-space indent, LF, UTF-8, trim trailing whitespace, final newline.
- Scripts: `npm run lint` (check) and `npm run lintfix` (write).

### Tests (`qa-engineer`)
- **`@vue/test-utils` v1** (Vue 2 line) + **Jest** (`jest`, `vue-jest`, `babel-jest`).
- Prefer `shallowMount`; use `mount` for integration. Mock the Vuex store, mock
  `firebase/firestore`, and mock the `lib/http` axios layer. Co-locate tests as `*.spec.js`.

## 6. Coding conventions (observed in the reference repos — replicate these)

- **Logging:** central `lib/logger.js` exporting `createLog({ message, severity, addlData })`
  which writes to a Firestore `logs` collection (`logType: 'CLIENT' | 'SERVER'`, uuid-v4 id
  stored on the doc, `serverTimestamp()`, `replaceUndefinedInObject()` before write).
  **Every `catch` block calls `createLog`.**
- **Error handling:** `try / catch / finally`; Vuex actions toggle a `loading` flag in
  `finally`. Server controllers on error: `createLog(...ERROR)` then `res.status(500).json('Error.')`.
- **Private helpers:** module-private functions are prefixed `_` and separated by a
  `/* private */` comment from the exports.
- **Vuex shape:** `export const state = () => ({ ... })`, UPPER_SNAKE mutation names, `Vue.set`
  for added reactive keys, `store/index.js` sets `export const strict = false`.
- **Constants:** UPPER_SNAKE in `lib/constants.js`.

## 7. Git & PRs

- Branch per task: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`. **Never push to `main`.**
- Commits are small and conventional (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).
- This repo's remote is the **ChromeDomeWebDesigns** org via the `git@github.com-cdwd` SSH
  host alias (`origin`). Use that alias (never the bare `git@github.com:` host). Open PRs
  with `gh`.
- A `PreToolUse` hook hard-blocks `git push` to main and the bare-host; a `TaskCompleted`
  hook blocks completion if lint/tests fail. Do not try to bypass them.

## 8. Guardrails (already enforced by `.claude/settings.json`)

- Full autonomy **inside this repo**; reads allowed anywhere; **writes outside the repo
  prompt for approval**; network open. Enforced by the Bash sandbox + `acceptEdits`.
- **Non-destructive dev commands run without prompts**: `npm install`/`ci`, `npm run
  lint`/`lintfix`/`build`/`test`, `npx eslint`/`prettier`, `node` (the npm cache `~/.npm` is
  sanctioned for writes so installs stay sandboxed).
- **Destructive commands still prompt** even in-repo: `rm`, `rmdir`, `chmod`, `chown`,
  `sudo`, `git reset --hard`, `git clean`.
- Credentials dirs (`~/.ssh`, `~/.aws`) are read-blocked.
- Keep secrets out of git (§4). Keep the work checkpointed to disk (§2).
