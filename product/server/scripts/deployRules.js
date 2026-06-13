/* eslint-disable no-console */
// deployRules.js — publish firestore.rules + storage.rules to the LIVE project.
//
// Run: node product/server/scripts/deployRules.js
// Requires: .env at repo root with FIREBASE_SERVICE_ACCOUNT_PATH and
//           NUXT_ENV_FIREBASE_STORAGE_BUCKET set.
//
// Why this exists (and why not `firebase deploy`):
//   Security rules in this repo are tested under the emulator (CI), but the LIVE
//   project enforces whatever ruleset is *released* to it. They are separate —
//   merging a rules change to `main` does NOT publish it. On 2026-06-13 this drift
//   caused "Missing or insufficient permissions" on the live app: PR #11 migrated
//   items to the `users/{uid}/items` subcollection, but the live project still had
//   the pre-migration top-level `/items` rules.
//   `firebase-tools deploy` runs a serviceusage API-enablement precheck that the
//   firebase-adminsdk service account is not permitted to call (403), so we publish
//   directly via the Firebase Rules REST API using a token minted from the SA.
//
// Idempotent: creates a fresh ruleset each run and points the release at it.

require('dotenv').config({
  path: require('path').resolve(__dirname, '../../../.env'),
})
const fs = require('fs')
const path = require('path')
const admin = require('firebase-admin')

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
  console.error('FIREBASE_SERVICE_ACCOUNT_PATH not set or file not found.')
  process.exit(1)
}
const serviceAccount = require(path.resolve(serviceAccountPath))
const PROJECT = serviceAccount.project_id
const BUCKET = process.env.NUXT_ENV_FIREBASE_STORAGE_BUCKET

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

const RULES_API = 'https://firebaserules.googleapis.com/v1'

async function _publish(token, { ruleFileName, sourcePath, releaseId }) {
  const base = `${RULES_API}/projects/${PROJECT}`
  const content = fs.readFileSync(
    path.resolve(__dirname, '../../..', sourcePath),
    'utf8'
  )

  // 1) create a ruleset from the source file
  const rsRes = await fetch(`${base}/rulesets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: { files: [{ name: ruleFileName, content }] },
    }),
  })
  const rs = await rsRes.json()
  if (!rsRes.ok) {
    throw new Error(
      `ruleset create failed (${rsRes.status}): ${JSON.stringify(rs)}`
    )
  }

  // 2) point the release at the new ruleset (PATCH existing; POST if absent)
  const fullRelease = `projects/${PROJECT}/releases/${releaseId}`
  let relRes = await fetch(`${base}/releases/${releaseId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      release: { name: fullRelease, rulesetName: rs.name },
    }),
  })
  if (relRes.status === 404) {
    relRes = await fetch(`${base}/releases`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: fullRelease, rulesetName: rs.name }),
    })
  }
  const rel = await relRes.json()
  if (!relRes.ok) {
    throw new Error(
      `release update failed (${relRes.status}): ${JSON.stringify(rel)}`
    )
  }
  console.log(`  ${releaseId} -> ${rs.name}`)
}

async function main() {
  console.log(`deployRules: publishing to '${PROJECT}'...`)
  const { access_token: token } = await admin
    .app()
    .options.credential.getAccessToken()

  await _publish(token, {
    ruleFileName: 'firestore.rules',
    sourcePath: 'firestore.rules',
    releaseId: 'cloud.firestore',
  })

  if (BUCKET) {
    await _publish(token, {
      ruleFileName: 'storage.rules',
      sourcePath: 'storage.rules',
      releaseId: `firebase.storage/${BUCKET}`,
    })
  } else {
    console.warn(
      '  (skipped storage: NUXT_ENV_FIREBASE_STORAGE_BUCKET not set)'
    )
  }

  console.log('deployRules: done. Live rules updated.')
  process.exit(0)
}

main().catch((err) => {
  console.error('deployRules: fatal error', err.message)
  process.exit(1)
})
