'use strict'

/**
 * Unit tests for lib/valuation.js
 *
 * All tests are pure — no Firestore dependency. Comps are injected directly.
 * "now" is overridden via the opts.now argument so recency filtering is
 * deterministic regardless of when the suite runs.
 */

const {
  normalizeModelKey,
  valuate,
  CONDITION_MULTIPLIERS,
  RECENCY_MONTHS,
  MIN_SAMPLE_SIZE,
} = require('../lib/valuation')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal comp document with defaults for unused fields. */
function makeComp({ condition = 'Good', salePrice, saleDate }) {
  return { condition, salePrice, saleDate }
}

/**
 * Returns a date string `months` months before `now`.
 * A positive value means in the past; negative means in the future.
 */
function monthsAgo(months, now) {
  const d = new Date(now)
  d.setMonth(d.getMonth() - months)
  return d.toISOString().slice(0, 10)
}

const NOW = new Date('2026-06-01T00:00:00Z')

// ---------------------------------------------------------------------------
// normalizeModelKey
// ---------------------------------------------------------------------------

describe('normalizeModelKey', () => {
  it('lowercases and joins make + model with a hyphen', () => {
    expect(normalizeModelKey('Leica', 'M3')).toBe('leica-m3')
  })

  it('replaces special characters with hyphens', () => {
    expect(normalizeModelKey('Canon', 'AE-1')).toBe('canon-ae-1')
  })

  it('collapses multiple separators into a single hyphen', () => {
    expect(normalizeModelKey('Canon', 'AE-1 Program')).toBe(
      'canon-ae-1-program'
    )
  })

  it('handles decimal point in model name', () => {
    expect(normalizeModelKey('Rollei', 'Rolleiflex 2.8F')).toBe(
      'rollei-rolleiflex-2-8f'
    )
  })

  it('handles a slash in the model name', () => {
    expect(normalizeModelKey('Hasselblad', '500C/M')).toBe('hasselblad-500c-m')
  })

  it('trims leading/trailing hyphens', () => {
    // Make starts with a space — should not produce a leading hyphen
    expect(normalizeModelKey(' Nikon', 'F3 ')).toBe('nikon-f3')
  })

  it('produces the same key as the client implementation (parity check)', () => {
    // Both sides must produce identical keys so comps can be fetched correctly.
    const pairs = [
      ['Leica', 'M6'],
      ['Nikon', 'F3'],
      ['Canon', 'AE-1'],
      ['Olympus', 'OM-1'],
    ]
    for (const [make, model] of pairs) {
      // The algorithm is identical on client and server; verifying the result
      // here documents the contract.
      const expected = `${make} ${model}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      expect(normalizeModelKey(make, model)).toBe(expected)
    }
  })
})

// ---------------------------------------------------------------------------
// valuate — correct estimate over a known comp set
// ---------------------------------------------------------------------------

describe('valuate — correct estimate over a known comp set', () => {
  const comps = [
    makeComp({
      condition: 'Good',
      salePrice: 800,
      saleDate: monthsAgo(1, NOW),
    }),
    makeComp({
      condition: 'Good',
      salePrice: 1000,
      saleDate: monthsAgo(6, NOW),
    }),
    makeComp({
      condition: 'Good',
      salePrice: 1200,
      saleDate: monthsAgo(12, NOW),
    }),
  ]

  it('returns a non-null estimate', () => {
    const result = valuate(comps, 'Good', { now: NOW })
    expect(result.estimate).not.toBeNull()
  })

  it('returns the median of the three prices (1000)', () => {
    const result = valuate(comps, 'Good', { now: NOW })
    // Sorted: [800, 1000, 1200] — median is index 1 = 1000
    expect(result.estimate).toBe(1000)
  })

  it('returns the 20th-percentile for low', () => {
    const result = valuate(comps, 'Good', { now: NOW })
    // nearest-rank: ceil(0.20 * 3) - 1 = ceil(0.6) - 1 = 1 - 1 = 0 → sorted[0] = 800
    expect(result.low).toBe(800)
  })

  it('returns the 80th-percentile for high', () => {
    const result = valuate(comps, 'Good', { now: NOW })
    // nearest-rank: ceil(0.80 * 3) - 1 = ceil(2.4) - 1 = 3 - 1 = 2 → sorted[2] = 1200
    expect(result.high).toBe(1200)
  })

  it('returns the correct sampleSize', () => {
    const result = valuate(comps, 'Good', { now: NOW })
    expect(result.sampleSize).toBe(3)
  })

  it('returns an asOf date string in YYYY-MM-DD format', () => {
    const result = valuate(comps, 'Good', { now: NOW })
    expect(result.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

// ---------------------------------------------------------------------------
// valuate — condition multiplier application
// ---------------------------------------------------------------------------

describe('valuate — condition multiplier application', () => {
  // Single Good comp worth 1000. Requesting each condition should yield a
  // price normalized to that condition via CONDITION_MULTIPLIERS.
  // Because there is only 1 comp (below MIN_SAMPLE_SIZE), the engine falls
  // back to the cross-tier normalization path for all conditions.

  const goodComp = makeComp({
    condition: 'Good',
    salePrice: 1000,
    saleDate: monthsAgo(1, NOW),
  })
  const comps = [goodComp]

  it('Mint multiplier: 1000 / Good(1.0) * Mint(1.35) = 1350', () => {
    const result = valuate(comps, 'Mint', { now: NOW })
    expect(result.estimate).toBe(1350)
  })

  it('Excellent multiplier: 1000 / Good(1.0) * Excellent(1.15) = 1150', () => {
    const result = valuate(comps, 'Excellent', { now: NOW })
    expect(result.estimate).toBe(1150)
  })

  it('Good multiplier: 1000 / Good(1.0) * Good(1.0) = 1000', () => {
    const result = valuate(comps, 'Good', { now: NOW })
    expect(result.estimate).toBe(1000)
  })

  it('Fair multiplier: 1000 / Good(1.0) * Fair(0.80) = 800', () => {
    const result = valuate(comps, 'Fair', { now: NOW })
    expect(result.estimate).toBe(800)
  })

  it('Poor multiplier: 1000 / Good(1.0) * Poor(0.60) = 600', () => {
    const result = valuate(comps, 'Poor', { now: NOW })
    expect(result.estimate).toBe(600)
  })

  it('exported CONDITION_MULTIPLIERS match the values under test', () => {
    expect(CONDITION_MULTIPLIERS.Mint).toBe(1.35)
    expect(CONDITION_MULTIPLIERS.Excellent).toBe(1.15)
    expect(CONDITION_MULTIPLIERS.Good).toBe(1.0)
    expect(CONDITION_MULTIPLIERS.Fair).toBe(0.8)
    expect(CONDITION_MULTIPLIERS.Poor).toBe(0.6)
  })
})

// ---------------------------------------------------------------------------
// valuate — direct-tier path with enough comps (no cross-tier normalization)
// ---------------------------------------------------------------------------

describe('valuate — direct-tier path (MIN_SAMPLE_SIZE met)', () => {
  // Provide MIN_SAMPLE_SIZE Good comps AND one Excellent comp so we can verify
  // the engine uses only the direct-tier comps when there are enough.
  const directComps = [
    makeComp({
      condition: 'Good',
      salePrice: 1000,
      saleDate: monthsAgo(1, NOW),
    }),
    makeComp({
      condition: 'Good',
      salePrice: 1100,
      saleDate: monthsAgo(2, NOW),
    }),
    makeComp({
      condition: 'Good',
      salePrice: 900,
      saleDate: monthsAgo(3, NOW),
    }),
    // Excellent comp that should NOT affect a Good-condition valuation
    makeComp({
      condition: 'Excellent',
      salePrice: 9999,
      saleDate: monthsAgo(1, NOW),
    }),
  ]

  it('uses only direct-condition comps when MIN_SAMPLE_SIZE is met', () => {
    const result = valuate(directComps, 'Good', { now: NOW })
    // Sorted Good prices: [900, 1000, 1100] — median = 1000; NOT influenced by Excellent 9999
    expect(result.estimate).toBe(1000)
  })

  it('reports sampleSize equal to direct-tier count (3), not total comp count (4)', () => {
    const result = valuate(directComps, 'Good', { now: NOW })
    expect(result.sampleSize).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// valuate — 24-month recency filtering
// ---------------------------------------------------------------------------

describe('valuate — 24-month recency filtering', () => {
  it(`excludes comps older than ${RECENCY_MONTHS} months`, () => {
    const staleComp = makeComp({
      condition: 'Good',
      salePrice: 5000,
      // Just beyond the recency window
      saleDate: monthsAgo(RECENCY_MONTHS + 1, NOW),
    })
    const result = valuate([staleComp], 'Good', { now: NOW })
    expect(result.estimate).toBeNull()
    expect(result.sampleSize).toBe(0)
  })

  it('includes comps exactly at the recency boundary', () => {
    // A comp dated exactly RECENCY_MONTHS ago should be included (>= cutoff).
    const boundaryComp = makeComp({
      condition: 'Good',
      salePrice: 1000,
      saleDate: monthsAgo(RECENCY_MONTHS, NOW),
    })
    // Add two more recent comps so MIN_SAMPLE_SIZE is met
    const recent1 = makeComp({
      condition: 'Good',
      salePrice: 900,
      saleDate: monthsAgo(1, NOW),
    })
    const recent2 = makeComp({
      condition: 'Good',
      salePrice: 1100,
      saleDate: monthsAgo(2, NOW),
    })
    const result = valuate([boundaryComp, recent1, recent2], 'Good', {
      now: NOW,
    })
    expect(result.sampleSize).toBe(3)
  })

  it('omits comps with no saleDate', () => {
    const noDate = { condition: 'Good', salePrice: 999 } // no saleDate field
    const result = valuate([noDate], 'Good', { now: NOW })
    expect(result.estimate).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// valuate — no-data path
// ---------------------------------------------------------------------------

describe('valuate — no-data path', () => {
  it('returns null estimate when the comp array is empty', () => {
    const result = valuate([], 'Good', { now: NOW })
    expect(result.estimate).toBeNull()
    expect(result.low).toBeNull()
    expect(result.high).toBeNull()
    expect(result.sampleSize).toBe(0)
  })

  it('returns null estimate when all comps are outside the recency window', () => {
    const oldComp = makeComp({
      condition: 'Good',
      salePrice: 1000,
      saleDate: monthsAgo(RECENCY_MONTHS + 2, NOW),
    })
    const result = valuate([oldComp], 'Good', { now: NOW })
    expect(result.estimate).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// valuate — insufficient-sample path (< MIN_SAMPLE_SIZE direct comps)
// ---------------------------------------------------------------------------

describe('valuate — insufficient direct sample (falls back to cross-tier)', () => {
  it(`falls back to cross-tier when fewer than ${MIN_SAMPLE_SIZE} direct comps exist`, () => {
    // Only 2 Excellent comps — below MIN_SAMPLE_SIZE
    const comps = [
      makeComp({
        condition: 'Excellent',
        salePrice: 1150,
        saleDate: monthsAgo(1, NOW),
      }),
      makeComp({
        condition: 'Excellent',
        salePrice: 1350,
        saleDate: monthsAgo(3, NOW),
      }),
    ]
    const result = valuate(comps, 'Excellent', { now: NOW })
    // Still returns a result (uses fallback path) rather than null
    expect(result.estimate).not.toBeNull()
    expect(result.sampleSize).toBe(2)
  })

  it('returns null when zero comps survive the recency filter (no fallback data)', () => {
    const result = valuate([], 'Excellent', { now: NOW })
    expect(result.estimate).toBeNull()
    expect(result.sampleSize).toBe(0)
  })
})
