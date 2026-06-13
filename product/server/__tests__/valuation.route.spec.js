'use strict'

/**
 * Unit tests for routes/valuation.js — GET /api/valuation
 *
 * Pattern mirrors export.route.spec.js: each describe group resets the module
 * registry and re-requires the route so each scenario gets a fresh mock.
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

describe('getValuation — db is null', () => {
  let getValuation

  beforeAll(() => {
    jest.resetModules()
    jest.doMock('../lib/firebase', () => ({ db: null }))
    jest.doMock('../lib/logger', () => ({
      createLog: jest.fn(),
      LOG_SEVERITIES: { ERROR: 'ERROR' },
    }))
    ;({ getValuation } = require('../routes/valuation'))
  })

  afterAll(() => {
    jest.resetModules()
  })

  it('returns 503 when db is null', async () => {
    const req = {
      uid: 'u1',
      query: { make: 'Leica', model: 'M3', condition: 'Good' },
    }
    const res = makeFakeRes()
    await getValuation(req, res)
    expect(res.status).toHaveBeenCalledWith(503)
  })

  it('includes "unavailable" in the 503 body', async () => {
    const req = {
      uid: 'u1',
      query: { make: 'Leica', model: 'M3', condition: 'Good' },
    }
    const res = makeFakeRes()
    await getValuation(req, res)
    expect(res.json).toHaveBeenCalledWith(
      expect.stringContaining('unavailable')
    )
  })
})

// ---------------------------------------------------------------------------
// Group 2 — missing query parameters
// ---------------------------------------------------------------------------

describe('getValuation — missing query parameters', () => {
  let getValuation

  beforeAll(() => {
    jest.resetModules()
    jest.doMock('../lib/firebase', () => ({
      db: { collection: jest.fn() },
    }))
    jest.doMock('../lib/logger', () => ({
      createLog: jest.fn(),
      LOG_SEVERITIES: { ERROR: 'ERROR' },
    }))
    ;({ getValuation } = require('../routes/valuation'))
  })

  afterAll(() => {
    jest.resetModules()
  })

  it('returns 400 when make is missing', async () => {
    const req = { uid: 'u1', query: { model: 'M3', condition: 'Good' } }
    const res = makeFakeRes()
    await getValuation(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 when model is missing', async () => {
    const req = { uid: 'u1', query: { make: 'Leica', condition: 'Good' } }
    const res = makeFakeRes()
    await getValuation(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 400 when condition is missing', async () => {
    const req = { uid: 'u1', query: { make: 'Leica', model: 'M3' } }
    const res = makeFakeRes()
    await getValuation(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })
})

// ---------------------------------------------------------------------------
// Group 3 — happy path: comps found, valuation returned
// ---------------------------------------------------------------------------

describe('getValuation — happy path', () => {
  let getValuation

  beforeAll(() => {
    jest.resetModules()

    // Three Good comps for leica-m3
    const fakeDocs = [
      {
        id: 'c1',
        data: () => ({
          condition: 'Good',
          salePrice: 800,
          saleDate: '2025-12-01',
          modelKey: 'leica-m3',
        }),
      },
      {
        id: 'c2',
        data: () => ({
          condition: 'Good',
          salePrice: 1000,
          saleDate: '2025-06-01',
          modelKey: 'leica-m3',
        }),
      },
      {
        id: 'c3',
        data: () => ({
          condition: 'Good',
          salePrice: 1200,
          saleDate: '2025-01-01',
          modelKey: 'leica-m3',
        }),
      },
    ]
    const mockGet = jest.fn().mockResolvedValue({ docs: fakeDocs })
    const mockWhere = jest.fn().mockReturnValue({ get: mockGet })
    const mockCollection = jest.fn().mockReturnValue({ where: mockWhere })

    jest.doMock('../lib/firebase', () => ({
      db: { collection: mockCollection },
    }))
    jest.doMock('../lib/logger', () => ({
      createLog: jest.fn(),
      LOG_SEVERITIES: { ERROR: 'ERROR' },
    }))
    ;({ getValuation } = require('../routes/valuation'))
  })

  afterAll(() => {
    jest.resetModules()
  })

  it('returns 200 (no explicit status call — defaults to 200)', async () => {
    const req = {
      uid: 'u1',
      query: { make: 'Leica', model: 'M3', condition: 'Good' },
    }
    const res = makeFakeRes()
    await getValuation(req, res)
    // No explicit status call means 200 — json is called directly
    expect(res.json).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('includes the modelKey in the response', async () => {
    const req = {
      uid: 'u1',
      query: { make: 'Leica', model: 'M3', condition: 'Good' },
    }
    const res = makeFakeRes()
    await getValuation(req, res)
    const payload = res.json.mock.calls[0][0]
    expect(payload.modelKey).toBe('leica-m3')
  })

  it('includes a numeric estimate in the response', async () => {
    const req = {
      uid: 'u1',
      query: { make: 'Leica', model: 'M3', condition: 'Good' },
    }
    const res = makeFakeRes()
    await getValuation(req, res)
    const payload = res.json.mock.calls[0][0]
    expect(typeof payload.estimate).toBe('number')
  })

  it('includes sampleSize in the response', async () => {
    const req = {
      uid: 'u1',
      query: { make: 'Leica', model: 'M3', condition: 'Good' },
    }
    const res = makeFakeRes()
    await getValuation(req, res)
    const payload = res.json.mock.calls[0][0]
    expect(payload.sampleSize).toBeGreaterThan(0)
  })

  it('includes low and high range fields in the response', async () => {
    const req = {
      uid: 'u1',
      query: { make: 'Leica', model: 'M3', condition: 'Good' },
    }
    const res = makeFakeRes()
    await getValuation(req, res)
    const payload = res.json.mock.calls[0][0]
    expect(payload).toHaveProperty('low')
    expect(payload).toHaveProperty('high')
  })
})

// ---------------------------------------------------------------------------
// Group 4 — no comps (null estimate returned)
// ---------------------------------------------------------------------------

describe('getValuation — no comps found', () => {
  let getValuation

  beforeAll(() => {
    jest.resetModules()

    const mockGet = jest.fn().mockResolvedValue({ docs: [] })
    const mockWhere = jest.fn().mockReturnValue({ get: mockGet })
    const mockCollection = jest.fn().mockReturnValue({ where: mockWhere })

    jest.doMock('../lib/firebase', () => ({
      db: { collection: mockCollection },
    }))
    jest.doMock('../lib/logger', () => ({
      createLog: jest.fn(),
      LOG_SEVERITIES: { ERROR: 'ERROR' },
    }))
    ;({ getValuation } = require('../routes/valuation'))
  })

  afterAll(() => {
    jest.resetModules()
  })

  it('returns estimate: null when no comps exist', async () => {
    const req = {
      uid: 'u1',
      query: { make: 'Unknown', model: 'Model', condition: 'Good' },
    }
    const res = makeFakeRes()
    await getValuation(req, res)
    const payload = res.json.mock.calls[0][0]
    expect(payload.estimate).toBeNull()
    expect(payload.sampleSize).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Group 5 — error path (db query rejects)
// ---------------------------------------------------------------------------

describe('getValuation — error path', () => {
  let getValuation
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
    ;({ getValuation } = require('../routes/valuation'))
  })

  afterAll(() => {
    jest.resetModules()
  })

  it('returns 500 when the db query rejects', async () => {
    const req = {
      uid: 'u1',
      query: { make: 'Leica', model: 'M3', condition: 'Good' },
    }
    const res = makeFakeRes()
    await getValuation(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('calls createLog with severity ERROR on db failure', async () => {
    const req = {
      uid: 'u1',
      query: { make: 'Leica', model: 'M3', condition: 'Good' },
    }
    const res = makeFakeRes()
    await getValuation(req, res)
    expect(createLog).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'ERROR' })
    )
  })
})
