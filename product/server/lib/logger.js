const consola = require('consola')
const { v4: uuidv4 } = require('uuid')
const admin = require('firebase-admin')
const { replaceUndefinedInObject } = require('./utils')

const LOG_SEVERITIES = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
}

async function createLog({
  message,
  severity = LOG_SEVERITIES.INFO,
  addlData = {},
}) {
  // Always log to console
  const consolaMethod = _severityToConsolaMethod(severity)
  consola[consolaMethod](message, addlData)

  // Write to Firestore if db is available
  const { db } = require('./firebase')
  if (!db) return

  try {
    const id = uuidv4()
    const payload = replaceUndefinedInObject({
      logType: 'SERVER',
      message,
      severity,
      addlData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    await db.collection('logs').doc(id).set(payload)
  } catch (err) {
    consola.error('createLog — failed to write to Firestore', err)
  }
}

/* private */

function _severityToConsolaMethod(severity) {
  switch (severity) {
    case LOG_SEVERITIES.DEBUG:
      return 'debug'
    case LOG_SEVERITIES.WARNING:
      return 'warn'
    case LOG_SEVERITIES.ERROR:
      return 'error'
    default:
      return 'info'
  }
}

module.exports = { LOG_SEVERITIES, createLog }
