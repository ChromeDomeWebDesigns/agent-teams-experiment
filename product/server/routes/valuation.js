const { createLog, LOG_SEVERITIES } = require('../lib/logger')
const { db } = require('../lib/firebase')
const { normalizeModelKey, valuate } = require('../lib/valuation')

// GET /api/valuation?make=&model=&condition=
// Returns a comp-backed valuation for the given make / model / condition.
// Requires: verifyFirebaseToken middleware (req.uid set).
async function getValuation(req, res) {
  try {
    if (!db) {
      return res
        .status(503)
        .json('Valuation unavailable — server not configured.')
    }

    const { make, model, condition } = req.query

    if (!make || !model || !condition) {
      return res.status(400).json('make, model, and condition are required.')
    }

    const modelKey = normalizeModelKey(make, model)

    const snap = await db
      .collection('comps')
      .where('modelKey', '==', modelKey)
      .get()

    const comps = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

    const result = valuate(comps, condition)

    return res.json({ modelKey, ...result })
  } catch (err) {
    await createLog({
      message: 'getValuation — error computing valuation',
      severity: LOG_SEVERITIES.ERROR,
      addlData: { error: err.message, query: req.query },
    })
    res.status(500).json('Error.')
  }
}

module.exports = { getValuation }
