/**
 * Normalize a make+model pair into a modelKey for comp matching.
 * Algorithm (must match the server byte-for-byte):
 *   1. Concatenate make and model with a space: `${make} ${model}`
 *   2. Lowercase the result
 *   3. Replace every run of non-alphanumeric characters with a single hyphen
 *   4. Trim leading/trailing hyphens
 *
 * Examples:
 *   normalizeModelKey('Canon', 'AE-1')          → 'canon-ae-1'
 *   normalizeModelKey('Leica', 'M3')             → 'leica-m3'
 *   normalizeModelKey('Hasselblad', '500C/M')    → 'hasselblad-500c-m'
 *
 * @param {string} make
 * @param {string} model
 * @returns {string}
 */
export function normalizeModelKey(make, model) {
  return `${make} ${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

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
