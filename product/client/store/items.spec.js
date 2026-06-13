import Vuex from 'vuex'
import { createLocalVue } from '@vue/test-utils'

// Mock @/lib/http so exportInsurance and fetchValuation never hit a real server
jest.mock('@/lib/http', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}))

// Mock firebase/firestore before importing the store
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' })),
}))

// Mock firebase/storage (items.js imports it for photo uploads)
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}))

// Mock the firebase plugin so db never touches a real project
jest.mock('@/plugins/firebase', () => ({
  db: {},
  auth: {},
}))

// Mock logger to assert error paths without real Firestore writes
jest.mock('@/lib/logger', () => ({
  createLog: jest.fn(),
  LOG_SEVERITIES: { INFO: 'INFO', WARNING: 'WARNING', ERROR: 'ERROR' },
}))

const localVue = createLocalVue()
localVue.use(Vuex)

// uid exposed via users module getter so items actions can read it
function makeStore({ uid = 'uid-test' } = {}) {
  const mod = require('@/store/items')
  return new Vuex.Store({
    modules: {
      users: {
        namespaced: true,
        state: () => ({ currentUser: uid ? { uid, email: 'a@b.com' } : null }),
        mutations: {},
        actions: {},
        getters: {
          uid: (state) => (state.currentUser ? state.currentUser.uid : null),
        },
      },
      items: {
        namespaced: true,
        state: mod.state,
        mutations: mod.mutations,
        actions: mod.actions,
        getters: mod.getters,
      },
    },
  })
}

describe('store/items', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('state shape', () => {
    it('initialises with an empty items array, loading false, and valuationPreview null', () => {
      const store = makeStore()
      expect(store.state.items.items).toEqual([])
      expect(store.state.items.loading).toBe(false)
      expect(store.state.items.valuationPreview).toBeNull()
    })
  })

  describe('totalValue getter', () => {
    it('sums estimatedValue.estimate across all items', () => {
      const store = makeStore()
      store.commit('items/SET_ITEMS', [
        { id: '1', estimatedValue: { estimate: 250 } },
        { id: '2', estimatedValue: { estimate: 80 } },
        { id: '3', estimatedValue: { estimate: 15.5 } },
      ])
      expect(store.getters['items/totalValue']).toBeCloseTo(345.5)
    })

    it('returns 0 when there are no items', () => {
      const store = makeStore()
      expect(store.getters['items/totalValue']).toBe(0)
    })

    it('treats missing estimatedValue as 0', () => {
      const store = makeStore()
      store.commit('items/SET_ITEMS', [
        { id: '1', estimatedValue: { estimate: 100 } },
        { id: '2' },
      ])
      expect(store.getters['items/totalValue']).toBe(100)
    })

    it('prefers userOverrideValue over estimatedValue.estimate', () => {
      const store = makeStore()
      store.commit('items/SET_ITEMS', [
        {
          id: '1',
          estimatedValue: { estimate: 1000 },
          userOverrideValue: 1200,
        },
        { id: '2', estimatedValue: { estimate: 300 } },
      ])
      expect(store.getters['items/totalValue']).toBe(1500)
    })
  })

  describe('fetchItems action', () => {
    it('queries the per-user subcollection and populates state', async () => {
      const { getDocs, collection } = require('firebase/firestore')
      collection.mockReturnValue('items-col')
      getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'doc-1',
            data: () => ({
              make: 'Leica',
              estimatedValue: { estimate: 1200 },
              userId: 'uid-test',
            }),
          },
          {
            id: 'doc-2',
            data: () => ({
              make: 'Nikon',
              estimatedValue: { estimate: 400 },
              userId: 'uid-test',
            }),
          },
        ],
      })

      const store = makeStore()
      await store.dispatch('items/fetchItems')

      // Reads the per-user subcollection path; no redundant where() filter
      expect(collection).toHaveBeenCalledWith(
        expect.anything(),
        'users',
        'uid-test',
        'items'
      )
      expect(getDocs).toHaveBeenCalled()
      expect(store.state.items.items).toHaveLength(2)
      expect(store.state.items.items[0]).toMatchObject({
        id: 'doc-1',
        make: 'Leica',
      })
    })

    it('resets loading to false after a successful fetch', async () => {
      const { getDocs, collection } = require('firebase/firestore')
      collection.mockReturnValue('items-col')
      getDocs.mockResolvedValueOnce({ docs: [] })

      const store = makeStore()
      await store.dispatch('items/fetchItems')

      expect(store.state.items.loading).toBe(false)
    })

    it('does nothing when there is no authenticated uid', async () => {
      const { getDocs } = require('firebase/firestore')
      const store = makeStore({ uid: null })
      await store.dispatch('items/fetchItems')
      expect(getDocs).not.toHaveBeenCalled()
    })

    it('calls createLog on error and rethrows', async () => {
      const { getDocs, collection } = require('firebase/firestore')
      collection.mockReturnValue('items-col')
      getDocs.mockRejectedValueOnce(new Error('unavailable'))

      const { createLog } = require('@/lib/logger')
      const store = makeStore()

      await expect(store.dispatch('items/fetchItems')).rejects.toThrow()

      expect(createLog).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'ERROR' })
      )
    })

    it('resets loading to false even when fetch throws', async () => {
      const { getDocs, collection } = require('firebase/firestore')
      collection.mockReturnValue('items-col')
      getDocs.mockRejectedValueOnce(new Error('fail'))

      const store = makeStore()
      await store.dispatch('items/fetchItems').catch(() => {})

      expect(store.state.items.loading).toBe(false)
    })
  })

  describe('addItem action', () => {
    it('writes a doc with userId, modelKey, estimatedValue, and serverTimestamp', async () => {
      const { setDoc, doc, serverTimestamp } = require('firebase/firestore')
      doc.mockReturnValue({})
      serverTimestamp.mockReturnValue({ _type: 'serverTimestamp' })
      setDoc.mockResolvedValueOnce()

      const store = makeStore()
      await store.dispatch('items/addItem', {
        formData: {
          make: 'Leica',
          model: 'M6',
          estimatedValue: {
            estimate: 1200,
            low: 900,
            high: 1500,
            sampleSize: 5,
          },
        },
        photoFile: null,
      })

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'uid-test',
          modelKey: 'leica-m6',
          estimatedValue: expect.objectContaining({ estimate: 1200 }),
          createdAt: expect.anything(),
        })
      )
    })

    it('appends the new item to state after a successful write', async () => {
      const { setDoc, doc } = require('firebase/firestore')
      doc.mockReturnValue({})
      setDoc.mockResolvedValueOnce()

      const store = makeStore()
      await store.dispatch('items/addItem', {
        formData: { make: 'Canon', model: 'AE-1' },
        photoFile: null,
      })

      expect(store.state.items.items).toHaveLength(1)
      expect(store.state.items.items[0]).toMatchObject({
        make: 'Canon',
        userId: 'uid-test',
      })
    })

    it('resets loading to false after a successful addItem', async () => {
      const { setDoc, doc } = require('firebase/firestore')
      doc.mockReturnValue({})
      setDoc.mockResolvedValueOnce()

      const store = makeStore()
      await store.dispatch('items/addItem', {
        formData: { make: 'Canon', model: 'AE-1' },
        photoFile: null,
      })

      expect(store.state.items.loading).toBe(false)
    })

    it('throws when there is no authenticated uid', async () => {
      const store = makeStore({ uid: null })
      await expect(
        store.dispatch('items/addItem', { formData: {}, photoFile: null })
      ).rejects.toThrow()
    })

    it('calls createLog on error and rethrows', async () => {
      const { setDoc, doc } = require('firebase/firestore')
      doc.mockReturnValue({})
      setDoc.mockRejectedValueOnce(new Error('permission-denied'))

      const { createLog } = require('@/lib/logger')
      const store = makeStore()

      await expect(
        store.dispatch('items/addItem', {
          formData: { make: 'Leica', model: 'M3' },
          photoFile: null,
        })
      ).rejects.toThrow()

      expect(createLog).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'ERROR' })
      )
    })

    it('resets loading to false even when addItem throws', async () => {
      const { setDoc, doc } = require('firebase/firestore')
      doc.mockReturnValue({})
      setDoc.mockRejectedValueOnce(new Error('fail'))

      const store = makeStore()
      await store
        .dispatch('items/addItem', { formData: {}, photoFile: null })
        .catch(() => {})

      expect(store.state.items.loading).toBe(false)
    })

    it('normalizes modelKey from make and model', async () => {
      const { setDoc, doc } = require('firebase/firestore')
      doc.mockReturnValue({})
      setDoc.mockResolvedValueOnce()

      const store = makeStore()
      await store.dispatch('items/addItem', {
        formData: { make: 'Canon', model: 'AE-1' },
        photoFile: null,
      })

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ modelKey: 'canon-ae-1' })
      )
    })
  })

  describe('exportInsurance action', () => {
    let http
    let firebasePlugin
    let createLog

    beforeEach(() => {
      http = require('@/lib/http').default
      firebasePlugin = require('@/plugins/firebase')
      createLog = require('@/lib/logger').createLog

      // Provide a fake currentUser on the mocked auth object
      firebasePlugin.auth.currentUser = {
        getIdToken: jest.fn().mockResolvedValue('id-token'),
      }

      // Stub window.open to return a fake popup window
      window.open = jest.fn(() => ({
        document: { write: jest.fn(), close: jest.fn() },
      }))
    })

    it('throws when there is no authenticated uid', async () => {
      const store = makeStore({ uid: null })
      await expect(store.dispatch('items/exportInsurance')).rejects.toThrow(
        'Not authenticated'
      )
    })

    it('calls http.get with /api/export and an Authorization Bearer header', async () => {
      http.get.mockResolvedValueOnce({ data: '<html>ok</html>' })
      const store = makeStore()
      await store.dispatch('items/exportInsurance')
      expect(http.get).toHaveBeenCalledWith(
        '/api/export',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer id-token',
          }),
        })
      )
    })

    it('calls window.open and writes the returned html', async () => {
      const fakeHtml = '<!doctype html><body>Leica</body>'
      http.get.mockResolvedValueOnce({ data: fakeHtml })
      const store = makeStore()
      await store.dispatch('items/exportInsurance')
      expect(window.open).toHaveBeenCalledWith('', '_blank')
      const fakeWin = window.open.mock.results[0].value
      expect(fakeWin.document.write).toHaveBeenCalledWith(fakeHtml)
      expect(fakeWin.document.close).toHaveBeenCalled()
    })

    it('resets loading to false after a successful export', async () => {
      http.get.mockResolvedValueOnce({ data: '<html></html>' })
      const store = makeStore()
      await store.dispatch('items/exportInsurance')
      expect(store.state.items.loading).toBe(false)
    })

    it('calls createLog with severity ERROR and rethrows when http.get rejects', async () => {
      http.get.mockRejectedValueOnce(new Error('network error'))
      const store = makeStore()
      await expect(store.dispatch('items/exportInsurance')).rejects.toThrow(
        'network error'
      )
      expect(createLog).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'ERROR' })
      )
    })

    it('resets loading to false even when http.get rejects', async () => {
      http.get.mockRejectedValueOnce(new Error('fail'))
      const store = makeStore()
      await store.dispatch('items/exportInsurance').catch(() => {})
      expect(store.state.items.loading).toBe(false)
    })
  })
})
