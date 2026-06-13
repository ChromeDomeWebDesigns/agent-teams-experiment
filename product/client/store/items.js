import Vue from 'vue'
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage'
import { v4 as uuidv4 } from 'uuid'
import { db, auth } from '@/plugins/firebase'
import http from '@/lib/http'
import { createLog, LOG_SEVERITIES } from '@/lib/logger'
import { replaceUndefinedInObject, normalizeModelKey } from '@/lib/utils'

export const state = () => ({
  items: [],
  loading: false,
  valuationPreview: null,
})

export const mutations = {
  SET_ITEMS(state, items) {
    Vue.set(state, 'items', items)
  },
  ADD_ITEM(state, item) {
    state.items.push(item)
  },
  SET_LOADING(state, val) {
    state.loading = val
  },
  SET_VALUATION_PREVIEW(state, preview) {
    Vue.set(state, 'valuationPreview', preview)
  },
  UPDATE_ITEM_ESTIMATED_VALUE(state, { itemId, estimatedValue }) {
    const idx = state.items.findIndex((i) => i.id === itemId)
    if (idx !== -1) {
      Vue.set(state.items[idx], 'estimatedValue', estimatedValue)
    }
  },
}

export const getters = {
  totalValue: (state) =>
    state.items.reduce((sum, item) => {
      const effective =
        item.userOverrideValue != null
          ? item.userOverrideValue
          : item.estimatedValue?.estimate ?? 0
      return sum + effective
    }, 0),
}

export const actions = {
  async fetchItems({ commit, rootGetters }) {
    const uid = rootGetters['users/uid']
    if (!uid) return
    commit('SET_LOADING', true)
    try {
      // The per-user subcollection path already scopes reads to this user;
      // no additional where() filter is needed here.
      const snap = await getDocs(collection(db, 'users', uid, 'items'))
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      commit('SET_ITEMS', items)
    } catch (err) {
      await createLog({
        message: 'fetchItems failed',
        severity: LOG_SEVERITIES.ERROR,
        addlData: { error: err.message },
      })
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchValuation({ commit }, { make, model, condition }) {
    commit('SET_VALUATION_PREVIEW', null)
    try {
      const { data } = await http.get('/api/valuation', {
        params: { make, model, condition },
      })
      commit('SET_VALUATION_PREVIEW', data)
      return data
    } catch (err) {
      await createLog({
        message: 'fetchValuation failed',
        severity: LOG_SEVERITIES.ERROR,
        addlData: { error: err.message, make, model, condition },
      })
      return null
    }
  },

  async addItem({ commit, rootGetters, state: s }, payload) {
    // Accept either a flat payload { userId?, make?, model?, photoFile?, ... }
    // or the legacy { formData, photoFile } shape.
    const flat = payload.formData
      ? { ...payload.formData, photoFile: payload.photoFile }
      : payload
    const uid = flat.userId || rootGetters['users/uid']
    if (!uid) throw new Error('Not authenticated')
    commit('SET_LOADING', true)
    try {
      const itemId = uuidv4()
      let photoPath = null

      if (flat.photoFile) {
        photoPath = await _uploadPhoto(uid, itemId, flat.photoFile)
      }

      const mKey = normalizeModelKey(flat.make || '', flat.model || '')

      // estimatedValue: use the preview if available, otherwise null
      const estimatedValue =
        flat.estimatedValue !== undefined
          ? flat.estimatedValue
          : s.valuationPreview || null

      const item = replaceUndefinedInObject({
        id: itemId,
        userId: uid,
        category: 'camera',
        name: flat.name || null,
        make: flat.make || null,
        model: flat.model || null,
        modelKey: mKey || null,
        serial: flat.serial || null,
        condition: flat.condition || null,
        purchasePrice: flat.purchasePrice ? Number(flat.purchasePrice) : null,
        purchaseDate: flat.purchaseDate || null,
        estimatedValue: estimatedValue || null,
        userOverrideValue: flat.userOverrideValue
          ? Number(flat.userOverrideValue)
          : null,
        photoPath,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      await setDoc(doc(db, 'users', uid, 'items', itemId), item)
      commit('ADD_ITEM', {
        ...item,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    } catch (err) {
      await createLog({
        message: 'addItem failed',
        severity: LOG_SEVERITIES.ERROR,
        addlData: { error: err.message },
      })
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async refreshEstimate({ commit, state: s, rootGetters }, itemId) {
    const uid = rootGetters['users/uid']
    if (!uid) throw new Error('Not authenticated')

    const item = s.items.find((i) => i.id === itemId)
    if (!item) throw new Error(`Item ${itemId} not found in state`)

    commit('SET_LOADING', true)
    try {
      const { data } = await http.get('/api/valuation', {
        params: {
          make: item.make,
          model: item.model,
          condition: item.condition,
        },
      })
      const estimatedValue = data || null
      // Write updated estimatedValue back to Firestore
      await updateDoc(doc(db, 'users', uid, 'items', itemId), {
        estimatedValue,
        updatedAt: serverTimestamp(),
      })
      commit('UPDATE_ITEM_ESTIMATED_VALUE', { itemId, estimatedValue })
      return estimatedValue
    } catch (err) {
      await createLog({
        message: 'refreshEstimate failed',
        severity: LOG_SEVERITIES.ERROR,
        addlData: { error: err.message, itemId },
      })
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async exportInsurance({ commit, rootGetters }) {
    const uid = rootGetters['users/uid']
    if (!uid) throw new Error('Not authenticated')
    commit('SET_LOADING', true)
    try {
      const token = await auth.currentUser.getIdToken()
      const { data: html } = await http.get('/api/export', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text',
      })
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
      }
      return html
    } catch (err) {
      await createLog({
        message: 'exportInsurance failed',
        severity: LOG_SEVERITIES.ERROR,
        addlData: { error: err.message },
      })
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },
}

/* private */

async function _uploadPhoto(uid, itemId, file) {
  const storage = getStorage()
  const path = `users/${uid}/items/${itemId}/${file.name}`
  const ref = storageRef(storage, path)
  await uploadBytes(ref, file)
  const url = await getDownloadURL(ref)
  return url
}
