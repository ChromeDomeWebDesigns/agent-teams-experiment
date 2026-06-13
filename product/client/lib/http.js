import axios from 'axios'
import { auth } from '@/plugins/firebase'

const http = axios.create({
  baseURL: process.env.NUXT_ENV_API_BASE || 'http://localhost:8080',
})

// Attach the Firebase ID token to every request so auth-guarded endpoints
// (valuation, deal-check, export) receive `Authorization: Bearer <token>`.
// Skips when no user is signed in, or when a caller already set the header.
http.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  const headers = config.headers || {}
  const alreadySet = headers.Authorization || headers.authorization
  if (user && !alreadySet) {
    const token = await user.getIdToken()
    headers.Authorization = `Bearer ${token}`
    config.headers = headers
  }
  return config
})

export default http
