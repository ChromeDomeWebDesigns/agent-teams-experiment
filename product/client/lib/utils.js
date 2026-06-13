/**
 * Recursively replace undefined values in an object with null so Firestore
 * does not reject the write.
 *
 * @param {Object} obj
 * @returns {Object}
 */
export function replaceUndefinedInObject(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      v === undefined ? null : replaceUndefinedInObject(v),
    ])
  )
}
