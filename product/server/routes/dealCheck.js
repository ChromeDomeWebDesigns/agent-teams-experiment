const { createLog, LOG_SEVERITIES } = require('../lib/logger')
const { db } = require('../lib/firebase')
const { normalizeModelKey, valuate } = require('../lib/valuation')

// POST /api/deal-check
// Body: { make, model, condition, askingPrice }
// Returns valuation result plus a deal verdict.
// Requires: verifyFirebaseToken middleware (req.uid set).
async function dealCheck(req, res) {
  try {
    if (!db) {
      return res
        .status(503)
        .json('Deal check unavailable — server not configured.')
    }

    const { make, model, condition, askingPrice } = req.body

    if (!make || !model || !condition || askingPrice == null) {
      return res
        .status(400)
        .json('make, model, condition, and askingPrice are required.')
    }

    const asking = parseFloat(askingPrice)
    if (isNaN(asking) || asking < 0) {
      return res.status(400).json('askingPrice must be a non-negative number.')
    }

    const modelKey = normalizeModelKey(make, model)

    const snap = await db
      .collection('comps')
      .where('modelKey', '==', modelKey)
      .get()

    const comps = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

    const valuation = valuate(comps, condition)

    const verdict = _computeVerdict(asking, valuation.low, valuation.high)

    return res.json({
      modelKey,
      estimate: valuation.estimate,
      low: valuation.low,
      high: valuation.high,
      sampleSize: valuation.sampleSize,
      asOf: valuation.asOf,
      askingPrice: asking,
      verdict,
    })
  } catch (err) {
    await createLog({
      message: 'dealCheck — error computing deal check',
      severity: LOG_SEVERITIES.ERROR,
      addlData: { error: err.message, body: req.body },
    })
    res.status(500).json('Error.')
  }
}

/* private */

/**
 * Computes the deal verdict from an asking price and the valuation range.
 *
 * Thresholds (agreed with client):
 *   asking < low  * 0.90  → 'under'
 *   asking > high * 1.10  → 'over'
 *   else                  → 'at'
 *   no-data (low/high null) → null
 *
 * @param {number}      asking
 * @param {number|null} low
 * @param {number|null} high
 * @returns {'under'|'at'|'over'|null}
 */
function _computeVerdict(asking, low, high) {
  if (low === null || high === null) return null
  if (asking < low * 0.9) return 'under'
  if (asking > high * 1.1) return 'over'
  return 'at'
}

module.exports = { dealCheck }
