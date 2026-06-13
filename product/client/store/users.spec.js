import Vuex from 'vuex'
import { createLocalVue } from '@vue/test-utils'

// Mock firebase/auth before importing the store
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}))

// Mock the firebase plugin so db/auth never touch a real project
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

function makeStore() {
  const mod = require('@/store/users')
  return new Vuex.Store({
    modules: {
      users: {
        namespaced: true,
        state: mod.state,
        mutations: mod.mutations,
        actions: mod.actions,
        getters: mod.getters,
      },
    },
  })
}

describe('store/users', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('state shape', () => {
    it('initialises with currentUser null and loading false', () => {
      const store = makeStore()
      expect(store.state.users.currentUser).toBeNull()
      expect(store.state.users.loading).toBe(false)
    })
  })

  describe('getters', () => {
    it('isAuthenticated is false when currentUser is null', () => {
      const store = makeStore()
      expect(store.getters['users/isAuthenticated']).toBe(false)
    })

    it('isAuthenticated is true when currentUser is set', () => {
      const store = makeStore()
      store.commit('users/SET_CURRENT_USER', { uid: 'uid-1', email: 'a@b.com' })
      expect(store.getters['users/isAuthenticated']).toBe(true)
    })

    it('uid returns null when currentUser is null', () => {
      const store = makeStore()
      expect(store.getters['users/uid']).toBeNull()
    })

    it('uid returns the currentUser uid when set', () => {
      const store = makeStore()
      store.commit('users/SET_CURRENT_USER', {
        uid: 'uid-42',
        email: 'a@b.com',
      })
      expect(store.getters['users/uid']).toBe('uid-42')
    })
  })

  describe('signIn action', () => {
    it('calls signInWithEmailAndPassword with the supplied credentials', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth')
      signInWithEmailAndPassword.mockResolvedValueOnce({
        user: { uid: 'uid-1', email: 'a@b.com', displayName: null },
      })

      const store = makeStore()
      await store.dispatch('users/signIn', {
        email: 'a@b.com',
        password: 'secret',
      })

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'a@b.com',
        'secret'
      )
    })

    it('sets currentUser in state after successful signIn', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth')
      signInWithEmailAndPassword.mockResolvedValueOnce({
        user: { uid: 'uid-1', email: 'a@b.com', displayName: 'Alice' },
      })

      const store = makeStore()
      await store.dispatch('users/signIn', {
        email: 'a@b.com',
        password: 'secret',
      })

      expect(store.state.users.currentUser).toMatchObject({
        uid: 'uid-1',
        email: 'a@b.com',
      })
    })

    it('resets loading to false after successful signIn', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth')
      signInWithEmailAndPassword.mockResolvedValueOnce({
        user: { uid: 'uid-1', email: 'a@b.com', displayName: null },
      })

      const store = makeStore()
      await store.dispatch('users/signIn', {
        email: 'a@b.com',
        password: 'secret',
      })

      expect(store.state.users.loading).toBe(false)
    })

    it('calls createLog on error and rethrows', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth')
      signInWithEmailAndPassword.mockRejectedValueOnce(
        Object.assign(new Error('bad credentials'), {
          code: 'auth/wrong-password',
        })
      )

      const { createLog } = require('@/lib/logger')
      const store = makeStore()

      await expect(
        store.dispatch('users/signIn', { email: 'a@b.com', password: 'wrong' })
      ).rejects.toThrow()

      expect(createLog).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'ERROR' })
      )
    })

    it('resets loading to false even when signIn throws', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth')
      signInWithEmailAndPassword.mockRejectedValueOnce(new Error('fail'))

      const store = makeStore()
      await store
        .dispatch('users/signIn', { email: 'a@b.com', password: 'x' })
        .catch(() => {})

      expect(store.state.users.loading).toBe(false)
    })
  })

  describe('signUp action', () => {
    it('calls createUserWithEmailAndPassword with the supplied credentials', async () => {
      const { createUserWithEmailAndPassword } = require('firebase/auth')
      createUserWithEmailAndPassword.mockResolvedValueOnce({
        user: { uid: 'uid-2', email: 'new@b.com', displayName: null },
      })

      const store = makeStore()
      await store.dispatch('users/signUp', {
        email: 'new@b.com',
        password: 'pass123',
      })

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'new@b.com',
        'pass123'
      )
    })

    it('calls createLog on error and rethrows', async () => {
      const { createUserWithEmailAndPassword } = require('firebase/auth')
      createUserWithEmailAndPassword.mockRejectedValueOnce(
        Object.assign(new Error('email in use'), {
          code: 'auth/email-already-in-use',
        })
      )

      const { createLog } = require('@/lib/logger')
      const store = makeStore()

      await expect(
        store.dispatch('users/signUp', {
          email: 'dup@b.com',
          password: 'pass123',
        })
      ).rejects.toThrow()

      expect(createLog).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'ERROR' })
      )
    })
  })

  describe('signOut action', () => {
    it('calls firebase signOut', async () => {
      const { signOut } = require('firebase/auth')
      signOut.mockResolvedValueOnce()

      const store = makeStore()
      store.commit('users/SET_CURRENT_USER', { uid: 'uid-1', email: 'a@b.com' })
      await store.dispatch('users/signOut')

      expect(signOut).toHaveBeenCalled()
    })

    it('sets currentUser to null after signOut', async () => {
      const { signOut } = require('firebase/auth')
      signOut.mockResolvedValueOnce()

      const store = makeStore()
      store.commit('users/SET_CURRENT_USER', { uid: 'uid-1', email: 'a@b.com' })
      await store.dispatch('users/signOut')

      expect(store.state.users.currentUser).toBeNull()
    })

    it('calls createLog on error and rethrows', async () => {
      const { signOut } = require('firebase/auth')
      signOut.mockRejectedValueOnce(
        Object.assign(new Error('network'), {
          code: 'auth/network-request-failed',
        })
      )

      const { createLog } = require('@/lib/logger')
      const store = makeStore()

      await expect(store.dispatch('users/signOut')).rejects.toThrow()

      expect(createLog).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'ERROR' })
      )
    })
  })
})
