/* eslint-disable no-console */
// seedComps.js — one-time seed script for the comps collection.
// Run: node product/server/scripts/seedComps.js
// Requires: .env at repo root with FIREBASE_SERVICE_ACCOUNT_PATH set.
// Safe to re-run: deletes all docs where status == 'seed' before re-writing.

require('dotenv').config({
  path: require('path').resolve(__dirname, '../../../.env'),
})

const path = require('path')
const fs = require('fs')
const admin = require('firebase-admin')

// ---------------------------------------------------------------------------
// Firebase init
// ---------------------------------------------------------------------------

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
  console.error('FIREBASE_SERVICE_ACCOUNT_PATH not set or file not found.')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(require(path.resolve(serviceAccountPath))),
})

const db = admin.firestore()

// ---------------------------------------------------------------------------
// Condition multipliers (must match lib/valuation.js)
// ---------------------------------------------------------------------------

const CONDITIONS = ['Mint', 'Excellent', 'Good', 'Fair', 'Poor']

// ---------------------------------------------------------------------------
// Seed data: [make, model, modelKey, baseGoodPrice, notes]
// baseGoodPrice = median Good-condition USD value (manually observed, 2024-2025)
// ---------------------------------------------------------------------------

const MODELS = [
  // Camera bodies
  ['Leica', 'M3', 'leica-m3', 1050],
  ['Leica', 'M6', 'leica-m6', 2400],
  ['Nikon', 'F2', 'nikon-f2', 310],
  ['Nikon', 'F3', 'nikon-f3', 260],
  ['Canon', 'AE-1', 'canon-ae-1', 130],
  ['Canon', 'AE-1 Program', 'canon-ae-1-program', 155],
  ['Canon', 'F-1', 'canon-f1', 220],
  ['Hasselblad', '500C/M', 'hasselblad-500cm', 1600],
  ['Pentax', 'K1000', 'pentax-k1000', 110],
  ['Olympus', 'OM-1', 'olympus-om1', 130],
  ['Olympus', 'OM-1n', 'olympus-om1n', 145],
  ['Minolta', 'X-700', 'minolta-x700', 95],
  ['Contax', 'RTS II', 'contax-rts-ii', 480],
  ['Rollei', 'Rolleiflex 2.8F', 'rollei-2-8f', 1900],
  ['Voigtlander', 'Bessa R2A', 'voigtlander-bessa-r2a', 560],
  // Lenses
  ['Leica', 'Summicron 50mm f/2', 'leica-summicron-50', 1200],
  ['Leica', 'Summilux 50mm f/1.4', 'leica-summilux-50', 2800],
  ['Nikkor', '50mm f/1.4 AI-S', 'nikkor-50-f14-ais', 180],
  ['Carl Zeiss', 'Planar 80mm f/2.8', 'zeiss-planar-80', 520],
  ['Canon', 'FD 50mm f/1.4', 'canon-fd-50-f14', 90],
  ['Voigtlander', 'Nokton 40mm f/1.4', 'voigtlander-nokton-40', 380],
  ['Olympus', 'Zuiko 50mm f/1.4', 'olympus-zuiko-50-f14', 75],
  ['Pentax', 'SMC 50mm f/1.7', 'pentax-smc-50-f17', 60],
]

// Multipliers relative to Good baseline
const MULTIPLIERS = {
  Mint: 1.35,
  Excellent: 1.15,
  Good: 1.0,
  Fair: 0.8,
  Poor: 0.6,
}

// Sources to cycle through for variety
const SOURCES = [
  'KEH.com used listing, observed 2024-Q4',
  'eBay sold listing (manual observation), Nov 2024',
  'eBay sold listing (manual observation), Oct 2024',
  'MPB used listing, observed 2025-Q1',
  'UsedPhotoPro sold listing, observed 2024-Q3',
  'Rangefinderforum sales thread, Oct 2024',
  'KEH.com used listing, observed 2025-Q1',
  'eBay sold listing (manual observation), Sep 2024',
  'Adorama used listing, observed 2024-Q4',
  'Photography-on-the-Net sales thread, Jan 2025',
]

// Recent sale dates spread across the last 20 months (all within RECENCY_MONTHS=24)
const SALE_DATES = [
  '2024-09-12',
  '2024-10-03',
  '2024-10-28',
  '2024-11-15',
  '2024-12-02',
  '2024-12-18',
  '2025-01-07',
  '2025-01-22',
  '2025-02-14',
  '2025-03-05',
  '2025-03-19',
  '2025-04-10',
  '2025-05-01',
  '2025-05-22',
  '2025-06-08',
]

/**
 * Generates N plausible sale prices around a base price with ±15% variance.
 * Each price is rounded to the nearest dollar.
 */
function _salePrices(base, n, seed) {
  const results = []
  for (let i = 0; i < n; i++) {
    // Deterministic variance using index so re-runs produce identical docs
    const factor = 1 + (((seed * 13 + i * 7) % 30) - 15) / 100
    results.push(Math.round(base * factor))
  }
  return results
}

function _pick(arr, i) {
  return arr[i % arr.length]
}

// ---------------------------------------------------------------------------
// Build comp docs
// ---------------------------------------------------------------------------

function buildComps() {
  const docs = []
  // 5 comps per condition tier for every model = 5 * 5 * 23 = 575 docs
  // Split across multiple Firestore batches (max 500/batch)
  const COMPS_PER_TIER = 5

  MODELS.forEach(([make, model, modelKey, baseGoodPrice], modelIdx) => {
    CONDITIONS.forEach((condition, condIdx) => {
      const multiplier = MULTIPLIERS[condition]
      const basePrice = baseGoodPrice * multiplier
      const prices = _salePrices(
        basePrice,
        COMPS_PER_TIER,
        modelIdx * 10 + condIdx
      )

      prices.forEach((salePrice, priceIdx) => {
        const globalIdx =
          modelIdx * CONDITIONS.length * COMPS_PER_TIER +
          condIdx * COMPS_PER_TIER +
          priceIdx
        const id = `seed-${modelKey}-${condition.toLowerCase()}-${priceIdx}`
        docs.push({
          id,
          data: {
            make,
            model,
            modelKey,
            condition,
            salePrice,
            saleDate: _pick(SALE_DATES, globalIdx),
            source: _pick(SOURCES, globalIdx),
            contributedBy: 'seed',
            status: 'seed',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          },
        })
      })
    })
  })

  return docs
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('seedComps: starting...')

  // 1. Delete existing seed docs
  console.log('seedComps: removing existing seed docs...')
  const existing = await db
    .collection('comps')
    .where('status', '==', 'seed')
    .get()
  if (existing.docs.length > 0) {
    // Firestore batch max 500; chunk deletions
    const chunks = _chunk(existing.docs, 499)
    for (const chunk of chunks) {
      const batch = db.batch()
      chunk.forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }
    console.log(
      `seedComps: deleted ${existing.docs.length} existing seed docs.`
    )
  } else {
    console.log('seedComps: no existing seed docs found.')
  }

  // 2. Write new seed docs
  const docs = buildComps()
  console.log(`seedComps: writing ${docs.length} seed docs...`)

  const chunks = _chunk(docs, 499)
  for (const chunk of chunks) {
    const batch = db.batch()
    chunk.forEach(({ id, data }) => {
      const ref = db.collection('comps').doc(id)
      batch.set(ref, data)
    })
    await batch.commit()
  }

  console.log(`seedComps: done. ${docs.length} comp docs written.`)
  console.log(
    `  Models: ${MODELS.length}, Conditions: ${CONDITIONS.length}, Per tier: 5`
  )
  process.exit(0)
}

/* private */

function _chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

main().catch((err) => {
  console.error('seedComps: fatal error', err)
  process.exit(1)
})
