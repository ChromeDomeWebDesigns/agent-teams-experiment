/**
 * Recursively replaces undefined values in an object with null so Firestore
 * does not throw on write (Firestore rejects undefined field values).
 */
function replaceUndefinedInObject(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj === undefined ? null : obj
  }

  if (Array.isArray(obj)) {
    return obj.map(replaceUndefinedInObject)
  }

  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, replaceUndefinedInObject(v)])
  )
}

module.exports = { replaceUndefinedInObject }
