import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/plugins/firebase'
import { createLog, LOG_SEVERITIES } from '@/lib/logger'
import { normalizeModelKey } from '@/lib/utils'

export const state = () => ({
  loading: false,
  saleSuccess: false,
  error: null,
})

export const mutations = {
  SET_LOADING(state, val) {
    state.loading = val
  },
  SET_SALE_SUCCESS(state, val) {
    state.saleSuccess = val
  },
  SET_ERROR(state, message) {
    state.error = message
  },
  RESET(state) {
    state.loading = false
    state.saleSuccess = false
    state.error = null
  },
}

export const actions = {
  /**
   * Write a user-submitted comp directly to the shared `comps` Firestore
   * collection using the client modular SDK. Firestore security rules enforce
   * that `contributedBy == request.auth.uid` and `status == 'user-submitted'`.
   *
   * @param {Object} payload
   * @param {string} payload.make
   * @param {string} payload.model
   * @param {string} payload.condition
   * @param {number} payload.salePrice
   * @param {string} payload.saleDate  ISO date string YYYY-MM-DD
   * @param {string} payload.source
   * @param {string} payload.uid       authenticated user uid
   */
  async logSale(
    { commit },
    { make, model, condition, salePrice, saleDate, source, uid }
  ) {
    if (!uid) throw new Error('Not authenticated')
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    try {
      const compId = uuidv4()
      const mKey = normalizeModelKey(make, model)
      const comp = {
        make,
        model,
        modelKey: mKey,
        condition,
        salePrice: Number(salePrice),
        saleDate,
        source,
        contributedBy: uid,
        status: 'user-submitted',
        createdAt: serverTimestamp(),
      }
      await setDoc(doc(db, 'comps', compId), comp)
      commit('SET_SALE_SUCCESS', true)
    } catch (err) {
      await createLog({
        message: 'comps/logSale failed',
        severity: LOG_SEVERITIES.ERROR,
        addlData: { error: err.message, make, model },
      })
      commit('SET_ERROR', 'Could not submit sale. Please try again.')
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },

  reset({ commit }) {
    commit('RESET')
  },
}
