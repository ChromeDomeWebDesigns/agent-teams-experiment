const { createLog, LOG_SEVERITIES } = require('../lib/logger')

// GET /api/export
// Returns a printable insurance document for the authenticated user's collection.
// Requires: verifyFirebaseToken middleware (req.uid set).
//
// Cycle-3 implementation notes:
//   1. Fetch all items where userId == req.uid via Admin SDK.
//   2. Resolve each item's photoPath to a signed Storage URL.
//   3. Render an HTML template (itemized list, photos, values, total, generated date).
//   4. Return as text/html (client opens print dialog) or pipe through a PDF renderer.
async function exportInsuranceDoc(req, res) {
  try {
    // TODO (cycle 3, unblocks when FIREBASE_SERVICE_ACCOUNT_PATH is provisioned):
    //   const { db } = require('../lib/firebase')
    //   const snap = await db.collection('items').where('userId', '==', req.uid).get()
    //   const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    //   ... render and return
    res
      .status(501)
      .json('Export not yet implemented — awaiting Firebase credentials.')
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
