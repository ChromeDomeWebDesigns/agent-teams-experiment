const admin = require('firebase-admin')
const { createLog, LOG_SEVERITIES } = require('../lib/logger')

// Verifies a Firebase ID token sent as `Authorization: Bearer <token>`.
// On success, attaches `req.uid` (the verified Firebase UID) and calls next().
// On failure, calls next('Not authorized').
async function verifyFirebaseToken(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return next('Not authorized')
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    req.uid = decoded.uid
    next()
  } catch (err) {
    await createLog({
      message: 'verifyFirebaseToken — invalid token',
      severity: LOG_SEVERITIES.WARNING,
      addlData: { error: err.message },
    })
    next('Not authorized')
  }
}

module.exports = { verifyFirebaseToken }
