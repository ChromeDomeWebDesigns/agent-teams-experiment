'use strict'

/**
 * Unit tests for routes/dealCheck.js — POST /api/deal-check
 *
 * Pattern mirrors export.route.spec.js: each describe group resets the module
 * registry and re-requires the route with fresh mocks.
 * verifyFirebaseToken is assumed to have already set req.uid; we test the
 * controller directly without running the Express middleware chain.
 */

function makeFakeRes() {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

// ---------------------------------------------------------------------------
// Group 1 — db is null (server not configured)
// ---------------------------------------------------------------------------

describe('dealCheck — db is null', () => {
  let dealCheck

  beforeAll(() => {
    jest.resetModules()
    jest.doMock('../lib/firebase', () => ({ db: null }))
    jest.doMock('../lib/logger', () => ({
      createLog: jest.fn(),
      LOG_SEVERITIES: { ERROR: 'ERROR' },
    }))
    ;({ dealCheck } = require('../routes/dealCheck'))
  })

  afterAll(() => {
    jest.resetModules()
  })

  it('returns 503 when db is null', async () => {
    const req = {
      uid: 'u1',
      body: {
        make: 'Leica',
        model: 'M3',
        condition: 'Good',
        askingPrice: 1000,
      },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    expect(res.status).toHaveBeenCalledWith(503)
  })

  it('includes "unavailable" in the 503 body', async () => {
    const req = {
      uid: 'u1',
      body: {
        make: 'Leica',
        model: 'M3',
        condition: 'Good',
        askingPrice: 1000,
      },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    expect(res.json).toHaveBeenCalledWith(
      expect.stringContaining('unavailable')
    )
  })
})

// ---------------------------------------------------------------------------
// Group 2 — missing / invalid body parameters
// ---------------------------------------------------------------------------

describe('dealCheck — missing / invalid body parameters', () => {
  let dealCheck

  beforeAll(() => {
    jest.resetModules()
    jest.doMock('../lib/firebase', () => ({
      db: { collection: jest.fn() },
    }))
    jest.doMock('../lib/logger', () => ({
      createLog: jest.fn(),
      LOG_SEVERITIES: { ERROR: 'ERROR' },
    }))
    ;({ dealCheck } = require('../routes/dealCheck'))
  })

  afterAll(() => {
    jest.resetModules()
  })

  it('returns 400 when make is missing', async () => {
    const req = {
      uid: 'u1',
      body: { model: 'M3', condition: 'Good', askingPrice: 1000 },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 when model is missing', async () => {
    const req = {
      uid: 'u1',
      body: { make: 'Leica', condition: 'Good', askingPrice: 1000 },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 when condition is missing', async () => {
    const req = {
      uid: 'u1',
      body: { make: 'Leica', model: 'M3', askingPrice: 1000 },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 when askingPrice is missing (null)', async () => {
    const req = {
      uid: 'u1',
      body: {
        make: 'Leica',
        model: 'M3',
        condition: 'Good',
        askingPrice: null,
      },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 when askingPrice is not a number (NaN)', async () => {
    const req = {
      uid: 'u1',
      body: {
        make: 'Leica',
        model: 'M3',
        condition: 'Good',
        askingPrice: 'notanumber',
      },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 when askingPrice is negative', async () => {
    const req = {
      uid: 'u1',
      body: { make: 'Leica', model: 'M3', condition: 'Good', askingPrice: -50 },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })
})

// ---------------------------------------------------------------------------
// Helpers for happy-path groups
// ---------------------------------------------------------------------------

/**
 * Builds a mock db that returns `salePrices` as Good comps dated 1 month ago.
 * Uses a fixed saleDate so recency filtering is deterministic.
 */
function makeDbWithComps(salePrices) {
  const fakeDocs = salePrices.map((price, i) => ({
    id: `c${i}`,
    data: () => ({
      condition: 'Good',
      salePrice: price,
      saleDate: '2026-05-01',
      modelKey: 'leica-m3',
    }),
  }))
  const mockGet = jest.fn().mockResolvedValue({ docs: fakeDocs })
  const mockWhere = jest.fn().mockReturnValue({ get: mockGet })
  return { collection: jest.fn().mockReturnValue({ where: mockWhere }) }
}

// ---------------------------------------------------------------------------
// Group 3 — verdict thresholds
//
// The engine uses Good comps at [800, 1000, 1200].
// Sorted: [800, 1000, 1200]
//   median  = 1000
//   low     = percentile(20) → sorted[0] = 800
//   high    = percentile(80) → sorted[2] = 1200
//
// Verdict thresholds:
//   under : asking < low  * 0.90  →  asking < 800  * 0.90 = 720
//   over  : asking > high * 1.10  →  asking > 1200 * 1.10 = 1320
//   at    : 720 <= asking <= 1320
// ---------------------------------------------------------------------------

describe('dealCheck — verdict: "under"', () => {
  let dealCheck

  beforeAll(() => {
    jest.resetModules()
    jest.doMock('../lib/firebase', () => ({
      db: makeDbWithComps([800, 1000, 1200]),
    }))
    jest.doMock('../lib/logger', () => ({
      createLog: jest.fn(),
      LOG_SEVERITIES: { ERROR: 'ERROR' },
    }))
    ;({ dealCheck } = require('../routes/dealCheck'))
  })

  afterAll(() => {
    jest.resetModules()
  })

  it('returns verdict "under" when asking < low * 0.90', async () => {
    // 700 < 720 (800 * 0.90) → under
    const req = {
      uid: 'u1',
      body: { make: 'Leica', model: 'M3', condition: 'Good', askingPrice: 700 },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    const payload = res.json.mock.calls[0][0]
    expect(payload.verdict).toBe('under')
  })
})

describe('dealCheck — verdict: "over"', () => {
  let dealCheck

  beforeAll(() => {
    jest.resetModules()
    jest.doMock('../lib/firebase', () => ({
      db: makeDbWithComps([800, 1000, 1200]),
    }))
    jest.doMock('../lib/logger', () => ({
      createLog: jest.fn(),
      LOG_SEVERITIES: { ERROR: 'ERROR' },
    }))
    ;({ dealCheck } = require('../routes/dealCheck'))
  })

  afterAll(() => {
    jest.resetModules()
  })

  it('returns verdict "over" when asking > high * 1.10', async () => {
    // 1400 > 1320 (1200 * 1.10) → over
    const req = {
      uid: 'u1',
      body: {
        make: 'Leica',
        model: 'M3',
        condition: 'Good',
        askingPrice: 1400,
      },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    const payload = res.json.mock.calls[0][0]
    expect(payload.verdict).toBe('over')
  })
})

describe('dealCheck — verdict: "at"', () => {
  let dealCheck

  beforeAll(() => {
    jest.resetModules()
    jest.doMock('../lib/firebase', () => ({
      db: makeDbWithComps([800, 1000, 1200]),
    }))
    jest.doMock('../lib/logger', () => ({
      createLog: jest.fn(),
      LOG_SEVERITIES: { ERROR: 'ERROR' },
    }))
    ;({ dealCheck } = require('../routes/dealCheck'))
  })

  afterAll(() => {
    jest.resetModules()
  })

  it('returns verdict "at" when asking is inside the range', async () => {
    // 1000 is between 720 and 1320 → at
    const req = {
      uid: 'u1',
      body: {
        make: 'Leica',
        model: 'M3',
        condition: 'Good',
        askingPrice: 1000,
      },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    const payload = res.json.mock.calls[0][0]
    expect(payload.verdict).toBe('at')
  })

  it('returns verdict "at" at exactly the low boundary (low * 0.90)', async () => {
    // 720 == 800 * 0.90 → not strictly less than → "at"
    const req = {
      uid: 'u1',
      body: { make: 'Leica', model: 'M3', condition: 'Good', askingPrice: 720 },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    const payload = res.json.mock.calls[0][0]
    expect(payload.verdict).toBe('at')
  })

  it('returns verdict "at" at exactly the high boundary (high * 1.10)', async () => {
    // 1320 == 1200 * 1.10 → not strictly greater than → "at"
    const req = {
      uid: 'u1',
      body: {
        make: 'Leica',
        model: 'M3',
        condition: 'Good',
        askingPrice: 1320,
      },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    const payload = res.json.mock.calls[0][0]
    expect(payload.verdict).toBe('at')
  })
})

// ---------------------------------------------------------------------------
// Group 4 — verdict: null when no comps (no-data path)
// ---------------------------------------------------------------------------

describe('dealCheck — verdict: null on no-data', () => {
  let dealCheck

  beforeAll(() => {
    jest.resetModules()
    jest.doMock('../lib/firebase', () => ({ db: makeDbWithComps([]) }))
    jest.doMock('../lib/logger', () => ({
      createLog: jest.fn(),
      LOG_SEVERITIES: { ERROR: 'ERROR' },
    }))
    ;({ dealCheck } = require('../routes/dealCheck'))
  })

  afterAll(() => {
    jest.resetModules()
  })

  it('returns verdict null when no comps exist', async () => {
    const req = {
      uid: 'u1',
      body: {
        make: 'Unknown',
        model: 'Camera',
        condition: 'Good',
        askingPrice: 500,
      },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    const payload = res.json.mock.calls[0][0]
    expect(payload.verdict).toBeNull()
  })

  it('returns estimate null when no comps exist', async () => {
    const req = {
      uid: 'u1',
      body: {
        make: 'Unknown',
        model: 'Camera',
        condition: 'Good',
        askingPrice: 500,
      },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    const payload = res.json.mock.calls[0][0]
    expect(payload.estimate).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Group 5 — happy path: response shape
// ---------------------------------------------------------------------------

describe('dealCheck — happy path response shape', () => {
  let dealCheck

  beforeAll(() => {
    jest.resetModules()
    jest.doMock('../lib/firebase', () => ({
      db: makeDbWithComps([800, 1000, 1200]),
    }))
    jest.doMock('../lib/logger', () => ({
      createLog: jest.fn(),
      LOG_SEVERITIES: { ERROR: 'ERROR' },
    }))
    ;({ dealCheck } = require('../routes/dealCheck'))
  })

  afterAll(() => {
    jest.resetModules()
  })

  it('returns all expected fields', async () => {
    const req = {
      uid: 'u1',
      body: {
        make: 'Leica',
        model: 'M3',
        condition: 'Good',
        askingPrice: 1000,
      },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    const payload = res.json.mock.calls[0][0]
    expect(payload).toHaveProperty('modelKey')
    expect(payload).toHaveProperty('estimate')
    expect(payload).toHaveProperty('low')
    expect(payload).toHaveProperty('high')
    expect(payload).toHaveProperty('sampleSize')
    expect(payload).toHaveProperty('asOf')
    expect(payload).toHaveProperty('askingPrice')
    expect(payload).toHaveProperty('verdict')
  })

  it('echoes back the numeric askingPrice', async () => {
    const req = {
      uid: 'u1',
      body: {
        make: 'Leica',
        model: 'M3',
        condition: 'Good',
        askingPrice: '1000',
      },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    const payload = res.json.mock.calls[0][0]
    // Route parses the string to a float before returning
    expect(payload.askingPrice).toBe(1000)
  })

  it('returns the modelKey for the given make+model', async () => {
    const req = {
      uid: 'u1',
      body: {
        make: 'Leica',
        model: 'M3',
        condition: 'Good',
        askingPrice: 1000,
      },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    const payload = res.json.mock.calls[0][0]
    expect(payload.modelKey).toBe('leica-m3')
  })
})

// ---------------------------------------------------------------------------
// Group 6 — error path (db query rejects)
// ---------------------------------------------------------------------------

describe('dealCheck — error path', () => {
  let dealCheck
  let createLog

  beforeAll(() => {
    jest.resetModules()

    const mockGet = jest.fn().mockRejectedValue(new Error('firestore down'))
    const mockWhere = jest.fn().mockReturnValue({ get: mockGet })
    const mockCollection = jest.fn().mockReturnValue({ where: mockWhere })

    jest.doMock('../lib/firebase', () => ({
      db: { collection: mockCollection },
    }))

    createLog = jest.fn()
    jest.doMock('../lib/logger', () => ({
      createLog,
      LOG_SEVERITIES: { ERROR: 'ERROR' },
    }))
    ;({ dealCheck } = require('../routes/dealCheck'))
  })

  afterAll(() => {
    jest.resetModules()
  })

  it('returns 500 when the db query rejects', async () => {
    const req = {
      uid: 'u1',
      body: {
        make: 'Leica',
        model: 'M3',
        condition: 'Good',
        askingPrice: 1000,
      },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('calls createLog with severity ERROR on db failure', async () => {
    const req = {
      uid: 'u1',
      body: {
        make: 'Leica',
        model: 'M3',
        condition: 'Good',
        askingPrice: 1000,
      },
    }
    const res = makeFakeRes()
    await dealCheck(req, res)
    expect(createLog).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'ERROR' })
    )
  })
})
