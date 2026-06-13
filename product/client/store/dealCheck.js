import Vue from 'vue'
import { auth } from '@/plugins/firebase'
import http from '@/lib/http'
import { createLog, LOG_SEVERITIES } from '@/lib/logger'

export const state = () => ({
  loading: false,
  result: null,
  error: null,
})

export const mutations = {
  SET_LOADING(state, val) {
    state.loading = val
  },
  SET_RESULT(state, result) {
    Vue.set(state, 'result', result)
    state.error = null
  },
  SET_ERROR(state, message) {
    state.error = message
    Vue.set(state, 'result', null)
  },
  CLEAR(state) {
    state.loading = false
    Vue.set(state, 'result', null)
    state.error = null
  },
}

export const actions = {
  async check({ commit }, { make, model, condition, askingPrice }) {
    commit('SET_LOADING', true)
    commit('SET_ERROR', null)
    try {
      const token = await auth.currentUser.getIdToken()
      const { data } = await http.post(
        '/api/deal-check',
        { make, model, condition, askingPrice },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      commit('SET_RESULT', data)
      return data
    } catch (err) {
      await createLog({
        message: 'dealCheck/check failed',
        severity: LOG_SEVERITIES.ERROR,
        addlData: { error: err.message, make, model, condition },
      })
      commit('SET_ERROR', 'Could not retrieve market data. Please try again.')
      throw err
    } finally {
      commit('SET_LOADING', false)
    }
  },

  clear({ commit }) {
    commit('CLEAR')
  },
}
