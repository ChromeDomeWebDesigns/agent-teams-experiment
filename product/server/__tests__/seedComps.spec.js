'use strict'

/**
 * Regression test: seed↔runtime modelKey parity.
 *
 * Asserts that every entry in scripts/seedComps.js produces a `modelKey`
 * (via `buildComps`) that equals `normalizeModelKey(make, model)` as the
 * runtime valuation engine would compute it.
 *
 * This test guards against the 2026-06-13 seed-parity bug where hand-coded
 * `modelKey` values (e.g. `hasselblad-500cm`) diverged from what the runtime
 * normalizer produced (`hasselblad-500c-m`), causing "no data" responses for
 * those models in-app.
 *
 * Requires: scripts/seedComps.js exports `{ MODELS, buildComps }` when
 * required as a module (not as the main script). The firebase-admin init and
 * process.exit guard must be gated on `require.main === module` so this test
 * can require the file safely.
 */

const { normalizeModelKey } = require('../lib/valuation')

// scripts/seedComps.js is not in testPathIgnorePatterns — require directly.
// Task #1 (be) makes these exports available by gating firebase-admin init
// on `require.main === module` and adding `module.exports = { MODELS, buildComps }`.
const { MODELS, buildComps } = require('../scripts/seedComps')

// ---------------------------------------------------------------------------
// normalizeModelKey — pin the originally-divergent cases
// ---------------------------------------------------------------------------

describe('normalizeModelKey — parity pin on originally-divergent seed entries', () => {
  it("normalizeModelKey('Hasselblad','500C/M') === 'hasselblad-500c-m'", () => {
    expect(normalizeModelKey('Hasselblad', '500C/M')).toBe('hasselblad-500c-m')
  })

  it("normalizeModelKey('Canon','AE-1') === 'canon-ae-1'", () => {
    expect(normalizeModelKey('Canon', 'AE-1')).toBe('canon-ae-1')
  })

  it("normalizeModelKey('Olympus','OM-1') === 'olympus-om-1'", () => {
    expect(normalizeModelKey('Olympus', 'OM-1')).toBe('olympus-om-1')
  })

  it("normalizeModelKey('Leica','Summicron 50mm f/2') === 'leica-summicron-50mm-f-2'", () => {
    expect(normalizeModelKey('Leica', 'Summicron 50mm f/2')).toBe(
      'leica-summicron-50mm-f-2'
    )
  })

  it("normalizeModelKey('Canon','F-1') === 'canon-f-1'", () => {
    expect(normalizeModelKey('Canon', 'F-1')).toBe('canon-f-1')
  })
})

// ---------------------------------------------------------------------------
// MODELS array — structural sanity
// ---------------------------------------------------------------------------

describe('MODELS array', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(MODELS)).toBe(true)
    expect(MODELS.length).toBeGreaterThan(0)
  })

  it('contains all originally-divergent make/model pairs', () => {
    const pairs = MODELS.map(([make, model]) => `${make}|${model}`)
    expect(pairs).toContain('Hasselblad|500C/M')
    expect(pairs).toContain('Canon|AE-1')
    expect(pairs).toContain('Olympus|OM-1')
    expect(pairs).toContain('Leica|Summicron 50mm f/2')
    expect(pairs).toContain('Canon|F-1')
  })
})

// ---------------------------------------------------------------------------
// buildComps — seed↔runtime modelKey parity (the core regression gate)
// ---------------------------------------------------------------------------

describe('buildComps — every seed doc modelKey matches normalizeModelKey(make, model)', () => {
  let docs

  beforeAll(() => {
    docs = buildComps()
  })

  it('produces at least one comp document', () => {
    expect(docs.length).toBeGreaterThan(0)
  })

  it('every doc.data.modelKey equals normalizeModelKey(make, model)', () => {
    // This is the regression gate. If any seed entry's modelKey diverges from
    // the runtime normalizer, this assertion surfaces it with a clear diff.
    const mismatches = docs
      .map(({ data }) => {
        const expected = normalizeModelKey(data.make, data.model)
        return data.modelKey !== expected
          ? {
              make: data.make,
              model: data.model,
              seeded: data.modelKey,
              expected,
            }
          : null
      })
      .filter(Boolean)

    expect(mismatches).toEqual([])
  })

  it('each originally-divergent model produces the correct runtime key', () => {
    // Spot-check the exact cases that were hand-coded wrong before the fix.
    const divergentCases = [
      { make: 'Hasselblad', model: '500C/M', expected: 'hasselblad-500c-m' },
      { make: 'Canon', model: 'AE-1', expected: 'canon-ae-1' },
      { make: 'Olympus', model: 'OM-1', expected: 'olympus-om-1' },
      {
        make: 'Leica',
        model: 'Summicron 50mm f/2',
        expected: 'leica-summicron-50mm-f-2',
      },
      { make: 'Canon', model: 'F-1', expected: 'canon-f-1' },
    ]

    for (const { make, model, expected } of divergentCases) {
      // Find any doc for this make+model (any condition will do)
      const doc = docs.find(
        (d) => d.data.make === make && d.data.model === model
      )
      expect(doc).toBeDefined()
      expect(doc.data.modelKey).toBe(expected)
    }
  })
})
