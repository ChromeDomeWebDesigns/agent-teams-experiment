const { createLog, LOG_SEVERITIES } = require('../lib/logger')
const { db } = require('../lib/firebase')
const { buildInsuranceHtml } = require('../lib/exportTemplate')

// GET /api/export
// Returns a printable insurance document for the authenticated user's collection.
// Requires: verifyFirebaseToken middleware (req.uid set).
async function exportInsuranceDoc(req, res) {
  try {
    if (!db) {
      return res.status(503).json('Export unavailable — server not configured.')
    }

    const snap = await db
      .collection('items')
      .where('userId', '==', req.uid)
      .get()

    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

    const html = buildInsuranceHtml(items, { generatedAt: new Date() })

    res.set('Content-Type', 'text/html').send(html)
  } catch (err) {
    await createLog({
      message: 'exportInsuranceDoc — error generating export',
      severity: LOG_SEVERITIES.ERROR,
      addlData: { error: err.message, uid: req.uid },
    })
    res.status(500).json('Error.')
  }
}

module.exports = { exportInsuranceDoc }
