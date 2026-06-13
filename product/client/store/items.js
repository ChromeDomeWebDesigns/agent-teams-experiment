import Vue from 'vue'
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  setDoc,
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
import { replaceUndefinedInObject } from '@/lib/utils'

export const state = () => ({
  items: [],
  loading: false,
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
}

export const getters = {
  totalValue: (state) =>
    state.items.reduce((sum, item) => sum + (item.currentValue || 0), 0),
}

export const actions = {
  async fetchItems({ commit, rootGetters }) {
    const uid = rootGetters['users/uid']
    if (!uid) return
    commit('SET_LOADING', true)
    try {
      const q = query(collection(db, 'items'), where('userId', '==', uid))
      const snap = await getDocs(q)
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

  async addItem({ commit, rootGetters }, payload) {
    // Accept either a flat payload { userId?, name?, make?, model?, currentValue?,
    // photoFile?, ... } or the legacy { formData, photoFile } shape.
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

      const item = replaceUndefinedInObject({
        id: itemId,
        userId: uid,
        category: 'camera',
        name: flat.name || null,
        make: flat.make || null,
        model: flat.model || null,
        serial: flat.serial || null,
        condition: flat.condition || null,
        purchasePrice: flat.purchasePrice ? Number(flat.purchasePrice) : null,
        purchaseDate: flat.purchaseDate || null,
        currentValue: flat.currentValue ? Number(flat.currentValue) : null,
        photoPath,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      await setDoc(doc(db, 'items', itemId), item)
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
