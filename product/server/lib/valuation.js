/**
 * valuation.js
 * Pure valuation engine — no Firestore dependency; comps are injected by the caller.
 * All constants are exported so callers and tests can reference them.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Recency window in months. Comps older than this are excluded from valuation. */
const RECENCY_MONTHS = 24

/**
 * Condition multipliers relative to "Good" (= 1.0 baseline).
 * Used to normalize comps from one condition tier to another as a fallback
 * when the requested tier lacks sufficient direct comps.
 */
const CONDITION_MULTIPLIERS = {
  Mint: 1.35,
  Excellent: 1.15,
  Good: 1.0,
  Fair: 0.8,
  Poor: 0.6,
}

/**
 * Minimum number of direct comps required for the engine to use that tier
 * directly (without applying a cross-tier multiplier).
 */
const MIN_SAMPLE_SIZE = 3

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Normalizes a make + model string into a Firestore-safe modelKey.
 *
 * Algorithm (agreed with client — must match byte-for-byte):
 *   1. Concatenate: `${make} ${model}`
 *   2. Lowercase the result
 *   3. Replace every run of non-alphanumeric characters with a single hyphen
 *   4. Trim leading and trailing hyphens
 *
 * Examples:
 *   normalizeModelKey('Leica', 'M3')           → 'leica-m3'
 *   normalizeModelKey('Canon', 'AE-1')         → 'canon-ae-1'
 *   normalizeModelKey('Canon', 'AE-1 Program') → 'canon-ae-1-program'
 *   normalizeModelKey('Rollei', 'Rolleiflex 2.8F') → 'rollei-rolleiflex-2-8f'
 *
 * @param {string} make
 * @param {string} model
 * @returns {string}
 */
function normalizeModelKey(make, model) {
  return `${make} ${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Computes a valuation from an injected array of comp documents.
 *
 * Strategy:
 *   1. Filter comps to those within the recency window (saleDate >= now - RECENCY_MONTHS).
 *   2. Try to use comps in the exact requested condition tier.
 *      If fewer than MIN_SAMPLE_SIZE exist, fall back to all available comps in any
 *      tier and normalize each to the requested condition via CONDITION_MULTIPLIERS.
 *   3. Compute estimate (median), low (20th-pct), high (80th-pct) on the adjusted prices.
 *
 * @param {Array<Object>} comps  - Array of comp docs; each must have { condition, salePrice, saleDate }.
 * @param {string}        condition - One of Mint / Excellent / Good / Fair / Poor.
 * @param {Object}        [opts]
 * @param {Date}          [opts.now] - Override "now" for testability (default: new Date()).
 * @returns {{ estimate: number|null, low: number|null, high: number|null, sampleSize: number, asOf: string }}
 */
function valuate(comps, condition, { now } = {}) {
  const asOfDate = now || new Date()
  const asOf = asOfDate.toISOString().slice(0, 10)

  const recentComps = _filterByRecency(comps, asOfDate)

  // Prefer direct comps for the requested condition tier
  const directComps = recentComps.filter((c) => c.condition === condition)

  let adjustedPrices
  let sampleSize

  if (directComps.length >= MIN_SAMPLE_SIZE) {
    // Enough direct comps — use them as-is
    adjustedPrices = directComps.map((c) => c.salePrice)
    sampleSize = directComps.length
  } else if (recentComps.length > 0) {
    // Fallback: normalize all recent comps to the requested condition
    const requestedMultiplier = CONDITION_MULTIPLIERS[condition] || 1.0
    adjustedPrices = recentComps.map((c) => {
      const sourceMultiplier = CONDITION_MULTIPLIERS[c.condition] || 1.0
      return (c.salePrice / sourceMultiplier) * requestedMultiplier
    })
    sampleSize = recentComps.length
  } else {
    // No data at all
    return { estimate: null, low: null, high: null, sampleSize: 0, asOf }
  }

  const sorted = [...adjustedPrices].sort((a, b) => a - b)

  const estimate = _median(sorted)
  const low = _percentile(sorted, 20)
  const high = _percentile(sorted, 80)

  return {
    estimate: _round2(estimate),
    low: _round2(low),
    high: _round2(high),
    sampleSize,
    asOf,
  }
}

// ---------------------------------------------------------------------------
/* private */
// ---------------------------------------------------------------------------

/**
 * Filters comps to those whose saleDate falls within RECENCY_MONTHS of `now`.
 * saleDate is expected to be an ISO date string (YYYY-MM-DD).
 */
function _filterByRecency(comps, now) {
  const cutoff = new Date(now)
  cutoff.setMonth(cutoff.getMonth() - RECENCY_MONTHS)
  return comps.filter((c) => {
    if (!c.saleDate) return false
    return new Date(c.saleDate) >= cutoff
  })
}

/** Median of a pre-sorted numeric array. */
function _median(sorted) {
  if (sorted.length === 0) return null
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

/**
 * Percentile of a pre-sorted array using nearest-rank method.
 * @param {number[]} sorted
 * @param {number}   pct     0–100
 */
function _percentile(sorted, pct) {
  if (sorted.length === 0) return null
  if (sorted.length === 1) return sorted[0]
  const idx = Math.max(0, Math.ceil((pct / 100) * sorted.length) - 1)
  return sorted[idx]
}

/** Round a number to 2 decimal places. */
function _round2(n) {
  if (n === null || n === undefined) return null
  return Math.round(n * 100) / 100
}

module.exports = {
  normalizeModelKey,
  valuate,
  CONDITION_MULTIPLIERS,
  RECENCY_MONTHS,
  MIN_SAMPLE_SIZE,
}
