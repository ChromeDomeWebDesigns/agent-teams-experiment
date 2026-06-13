import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '@/plugins/firebase'
import { createLog, LOG_SEVERITIES } from '@/lib/logger'

export const state = () => ({
  currentUser: null,
  loading: false,
})

export const mutations = {
  SET_CURRENT_USER(state, user) {
    state.currentUser = user
  },
  SET_LOADING(state, val) {
    state.loading = val
  },
}

export const getters = {
  isAuthenticated: (state) => !!state.currentUser,
  uid: (state) => (state.currentUser ? state.currentUser.uid : null),
}

export const actions = {
  /**
   * Bootstrap the Firebase auth-state observer. Call once from a client plugin
   * before any navigation so the store stays in sync.
   */
  initAuthObserver({ commit }) {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, (user) => {
        commit('SET_CURRENT_USER', user ? _serialize(user) : null)
        resolve(user)
      })
    })
  },

  async signUp({ commit }, { email, password }) {
    commit('SET_LOADING', true)
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      commit('SET_CURRENT_USER', _serialize(user))
    } catch (err) {
      await createLog({
        message: 'signUp failed',
        severity: LOG_SEVERITIES.ERROR,
        addlData: { code: err.code },
      })
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async signIn({ commit }, { email, password }) {
    commit('SET_LOADING', true)
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      commit('SET_CURRENT_USER', _serialize(user))
    } catch (err) {
      await createLog({
        message: 'signIn failed',
        severity: LOG_SEVERITIES.ERROR,
        addlData: { code: err.code },
      })
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async signOut({ commit }) {
    commit('SET_LOADING', true)
    try {
      await firebaseSignOut(auth)
      commit('SET_CURRENT_USER', null)
    } catch (err) {
      await createLog({
        message: 'signOut failed',
        severity: LOG_SEVERITIES.ERROR,
        addlData: { code: err.code },
      })
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },
}

/* private */

function _serialize(user) {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || null,
  }
}
