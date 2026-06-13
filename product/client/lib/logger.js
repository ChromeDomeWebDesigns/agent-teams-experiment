import { v4 as uuidv4 } from 'uuid'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import consola from 'consola'
import { db } from '@/plugins/firebase'
import { replaceUndefinedInObject } from '@/lib/utils'

export const LOG_SEVERITIES = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
}

/**
 * Log a message to the console and persist it to the Firestore `logs` collection.
 *
 * @param {{ message: string, severity: string, vueInstance?: object, addlData?: object }} params
 */
export async function createLog({ message, severity, vueInstance, addlData }) {
  const level = severity || LOG_SEVERITIES.INFO
  const entry = {
    logType: 'CLIENT',
    message,
    severity: level,
    addlData: addlData || null,
    createdAt: serverTimestamp(),
  }

  // Mirror to console
  if (level === LOG_SEVERITIES.ERROR) {
    consola.error('[vault]', message, addlData || '')
  } else if (level === LOG_SEVERITIES.WARNING) {
    consola.warn('[vault]', message, addlData || '')
  } else {
    consola.info('[vault]', message, addlData || '')
  }

  // Persist to Firestore
  try {
    const id = uuidv4()
    const ref = doc(db, 'logs', id)
    await setDoc(ref, replaceUndefinedInObject({ id, ...entry }))
  } catch (err) {
    // Avoid infinite recursion — only console here
    consola.error('[vault/logger] Failed to persist log to Firestore:', err)
  }
}
