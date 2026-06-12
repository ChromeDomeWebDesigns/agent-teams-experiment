import axios from 'axios'

const http = axios.create({
  baseURL: process.env.NUXT_ENV_API_BASE || 'http://localhost:8080',
})

export default http
