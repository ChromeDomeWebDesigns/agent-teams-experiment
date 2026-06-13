import Vuex from 'vuex'
import { createLocalVue } from '@vue/test-utils'

// Mock firebase/firestore before importing the store
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
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
    it('initialises with an empty items array and loading false', () => {
      const store = makeStore()
      expect(store.state.items.items).toEqual([])
      expect(store.state.items.loading).toBe(false)
    })
  })

  describe('totalValue getter', () => {
    it('sums currentValue across all items', () => {
      const store = makeStore()
      store.commit('items/SET_ITEMS', [
        { id: '1', currentValue: 250 },
        { id: '2', currentValue: 80 },
        { id: '3', currentValue: 15.5 },
      ])
      expect(store.getters['items/totalValue']).toBeCloseTo(345.5)
    })

    it('returns 0 when there are no items', () => {
      const store = makeStore()
      expect(store.getters['items/totalValue']).toBe(0)
    })

    it('treats missing currentValue as 0', () => {
      const store = makeStore()
      store.commit('items/SET_ITEMS', [
        { id: '1', currentValue: 100 },
        { id: '2' },
      ])
      expect(store.getters['items/totalValue']).toBe(100)
    })
  })

  describe('fetchItems action', () => {
    it('queries Firestore with where userId == uid and populates state', async () => {
      const {
        getDocs,
        query,
        where,
        collection,
      } = require('firebase/firestore')
      collection.mockReturnValue('items-col')
      where.mockReturnValue('where-clause')
      query.mockReturnValue('built-query')
      getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'doc-1',
            data: () => ({
              make: 'Leica',
              currentValue: 1200,
              userId: 'uid-test',
            }),
          },
          {
            id: 'doc-2',
            data: () => ({
              make: 'Nikon',
              currentValue: 400,
              userId: 'uid-test',
            }),
          },
        ],
      })

      const store = makeStore()
      await store.dispatch('items/fetchItems')

      expect(where).toHaveBeenCalledWith('userId', '==', 'uid-test')
      expect(getDocs).toHaveBeenCalled()
      expect(store.state.items.items).toHaveLength(2)
      expect(store.state.items.items[0]).toMatchObject({
        id: 'doc-1',
        make: 'Leica',
      })
    })

    it('resets loading to false after a successful fetch', async () => {
      const {
        getDocs,
        query,
        where,
        collection,
      } = require('firebase/firestore')
      collection.mockReturnValue('items-col')
      where.mockReturnValue('where-clause')
      query.mockReturnValue('built-query')
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
      const {
        getDocs,
        query,
        where,
        collection,
      } = require('firebase/firestore')
      collection.mockReturnValue('items-col')
      where.mockReturnValue('where-clause')
      query.mockReturnValue('built-query')
      getDocs.mockRejectedValueOnce(new Error('unavailable'))

      const { createLog } = require('@/lib/logger')
      const store = makeStore()

      await expect(store.dispatch('items/fetchItems')).rejects.toThrow()

      expect(createLog).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'ERROR' })
      )
    })

    it('resets loading to false even when fetch throws', async () => {
      const {
        getDocs,
        query,
        where,
        collection,
      } = require('firebase/firestore')
      collection.mockReturnValue('items-col')
      where.mockReturnValue('where-clause')
      query.mockReturnValue('built-query')
      getDocs.mockRejectedValueOnce(new Error('fail'))

      const store = makeStore()
      await store.dispatch('items/fetchItems').catch(() => {})

      expect(store.state.items.loading).toBe(false)
    })
  })

  describe('addItem action', () => {
    it('writes a doc with userId, currentValue, and serverTimestamp', async () => {
      const {
        setDoc,
        doc,
        collection,
        serverTimestamp,
      } = require('firebase/firestore')
      collection.mockReturnValue('items-col')
      doc.mockReturnValue({})
      serverTimestamp.mockReturnValue({ _type: 'serverTimestamp' })
      setDoc.mockResolvedValueOnce()

      const store = makeStore()
      await store.dispatch('items/addItem', {
        formData: { make: 'Leica', model: 'M6', currentValue: '1200' },
        photoFile: null,
      })

      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: 'uid-test',
          currentValue: 1200,
          createdAt: expect.anything(),
        })
      )
    })

    it('appends the new item to state after a successful write', async () => {
      const { setDoc, doc, collection } = require('firebase/firestore')
      collection.mockReturnValue('items-col')
      doc.mockReturnValue({})
      setDoc.mockResolvedValueOnce()

      const store = makeStore()
      await store.dispatch('items/addItem', {
        formData: { make: 'Canon', currentValue: '300' },
        photoFile: null,
      })

      expect(store.state.items.items).toHaveLength(1)
      expect(store.state.items.items[0]).toMatchObject({
        make: 'Canon',
        userId: 'uid-test',
      })
    })

    it('resets loading to false after a successful addItem', async () => {
      const { setDoc, doc, collection } = require('firebase/firestore')
      collection.mockReturnValue('items-col')
      doc.mockReturnValue({})
      setDoc.mockResolvedValueOnce()

      const store = makeStore()
      await store.dispatch('items/addItem', {
        formData: { make: 'Canon', currentValue: '300' },
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
      const { setDoc, doc, collection } = require('firebase/firestore')
      collection.mockReturnValue('items-col')
      doc.mockReturnValue({})
      setDoc.mockRejectedValueOnce(new Error('permission-denied'))

      const { createLog } = require('@/lib/logger')
      const store = makeStore()

      await expect(
        store.dispatch('items/addItem', {
          formData: { make: 'Leica', currentValue: '500' },
          photoFile: null,
        })
      ).rejects.toThrow()

      expect(createLog).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'ERROR' })
      )
    })

    it('resets loading to false even when addItem throws', async () => {
      const { setDoc, doc, collection } = require('firebase/firestore')
      collection.mockReturnValue('items-col')
      doc.mockReturnValue({})
      setDoc.mockRejectedValueOnce(new Error('fail'))

      const store = makeStore()
      await store
        .dispatch('items/addItem', { formData: {}, photoFile: null })
        .catch(() => {})

      expect(store.state.items.loading).toBe(false)
    })
  })
})
