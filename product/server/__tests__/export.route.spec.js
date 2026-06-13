'use strict'

/**
 * Unit tests for exportInsuranceDoc route controller.
 *
 * Uses jest.resetModules() + jest.doMock() to isolate the two scenarios that
 * require different `db` states (null vs. live mock), so each test group gets
 * a fresh module registry.
 */

// Helper: build a chainable fake response object
function makeFakeRes() {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.set = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

// ---------------------------------------------------------------------------
// Group 1 — db is null (server not configured)
// ---------------------------------------------------------------------------
describe('exportInsuranceDoc — db is null', () => {
  let exportInsuranceDoc

  beforeAll(() => {
    jest.resetModules()
    jest.doMock('../lib/firebase', () => ({ db: null }))
    jest.doMock('../lib/logger', () => ({
      createLog: jest.fn(),
      LOG_SEVERITIES: { ERROR: 'ERROR' },
    }))
    ;({ exportInsuranceDoc } = require('../routes/export'))
  })

  afterAll(() => {
    jest.resetModules()
  })

  it('returns 503 when db is null', async () => {
    const req = { uid: 'u1' }
    const res = makeFakeRes()
    await exportInsuranceDoc(req, res)
    expect(res.status).toHaveBeenCalledWith(503)
  })

  it('includes an informative message in the 503 body', async () => {
    const req = { uid: 'u1' }
    const res = makeFakeRes()
    await exportInsuranceDoc(req, res)
    expect(res.json).toHaveBeenCalledWith(
      expect.stringContaining('unavailable')
    )
  })
})

// ---------------------------------------------------------------------------
// Group 2 — happy path with a mocked db
// ---------------------------------------------------------------------------
describe('exportInsuranceDoc — happy path', () => {
  let exportInsuranceDoc
  let mockGet

  beforeAll(() => {
    jest.resetModules()

    mockGet = jest.fn().mockResolvedValue({
      docs: [
        {
          id: '1',
          data: () => ({ make: 'Leica', currentValue: 100, userId: 'u1' }),
        },
      ],
    })

    const mockWhere = jest.fn().mockReturnValue({ get: mockGet })
    const mockCollection = jest.fn().mockReturnValue({ where: mockWhere })

    jest.doMock('../lib/firebase', () => ({
      db: { collection: mockCollection },
    }))
    jest.doMock('../lib/logger', () => ({
      createLog: jest.fn(),
      LOG_SEVERITIES: { ERROR: 'ERROR' },
    }))
    ;({ exportInsuranceDoc } = require('../routes/export'))
  })

  afterAll(() => {
    jest.resetModules()
  })

  it('sets Content-Type to text/html', async () => {
    const req = { uid: 'u1' }
    const res = makeFakeRes()
    await exportInsuranceDoc(req, res)
    expect(res.set).toHaveBeenCalledWith('Content-Type', 'text/html')
  })

  it('sends an HTML string containing the item make', async () => {
    const req = { uid: 'u1' }
    const res = makeFakeRes()
    await exportInsuranceDoc(req, res)
    const sentHtml = res.send.mock.calls[0][0]
    expect(typeof sentHtml).toBe('string')
    expect(sentHtml).toContain('Leica')
  })

  it('sends a document starting with <!doctype html', async () => {
    const req = { uid: 'u1' }
    const res = makeFakeRes()
    await exportInsuranceDoc(req, res)
    const sentHtml = res.send.mock.calls[0][0]
    expect(sentHtml.toLowerCase()).toContain('<!doctype html')
  })
})

// ---------------------------------------------------------------------------
// Group 3 — error path (db query rejects)
// ---------------------------------------------------------------------------
describe('exportInsuranceDoc — error path', () => {
  let exportInsuranceDoc
  let createLog

  beforeAll(() => {
    jest.resetModules()

    const mockGet = jest
      .fn()
      .mockRejectedValue(new Error('firestore unavailable'))
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
    ;({ exportInsuranceDoc } = require('../routes/export'))
  })

  afterAll(() => {
    jest.resetModules()
  })

  it('responds with status 500 when the db query rejects', async () => {
    const req = { uid: 'u1' }
    const res = makeFakeRes()
    await exportInsuranceDoc(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('calls createLog with severity ERROR when the db query rejects', async () => {
    const req = { uid: 'u1' }
    const res = makeFakeRes()
    await exportInsuranceDoc(req, res)
    expect(createLog).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'ERROR' })
    )
  })
})
