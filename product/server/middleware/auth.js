const jwt = require('jsonwebtoken')
const { createLog, LOG_SEVERITIES } = require('../lib/logger')

async function requireAuth(req, res, next) {
  try {
    jwt.verify(req.headers.authorization, process.env.JWT_SECRET)
    next()
  } catch (err) {
    await createLog({
      message: 'requireAuth — unauthorized request',
      severity: LOG_SEVERITIES.WARNING,
      addlData: { error: err.message },
    })
    next('Not authorized')
  }
}

module.exports = { requireAuth }
