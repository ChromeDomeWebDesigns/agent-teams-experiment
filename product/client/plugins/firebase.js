import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import consola from 'consola'
import firebaseConfig from '@/firebase.config'

let app

if (!firebaseConfig.apiKey) {
  consola.warn(
    '[firebase] NUXT_ENV_FIREBASE_API_KEY is not set — Firestore/Auth will not work. ' +
      'Add Firebase env vars to .env and restart.'
  )
}

// Reuse existing app in HMR scenarios
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

export const db = getFirestore(app)
export const auth = getAuth(app)
