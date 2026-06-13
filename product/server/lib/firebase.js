const path = require('path')
const fs = require('fs')
const admin = require('firebase-admin')
const consola = require('consola')

let db = null

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH

if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
  const serviceAccount = require(path.resolve(serviceAccountPath))
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
  db = admin.firestore()
} else {
  consola.warn('Firebase not configured — running without DB')
}

module.exports = { db }
