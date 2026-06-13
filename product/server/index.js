// Load the repo-root .env regardless of the process cwd, so `npm --prefix
// product/server run dev` (cwd = product/server) still finds the single root .env.
require('dotenv').config({
  path: require('path').resolve(__dirname, '../../.env'),
})

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const consola = require('consola')

const { health } = require('./routes/health')
const { exportInsuranceDoc } = require('./routes/export')
const { verifyFirebaseToken } = require('./middleware/verifyFirebaseToken')

require('./lib/firebase')

const app = express()

app.use(cors())
app.use(bodyParser.json())

// Base route
app.get('/api', (req, res) => {
  res.send('Ok')
})

// Health route
const healthRouter = express.Router()
healthRouter.get('/', health)
app.use('/api/health', healthRouter)

// Export route — auth-guarded; returns a printable insurance document
const exportRouter = express.Router()
exportRouter.get('/', verifyFirebaseToken, exportInsuranceDoc)
app.use('/api/export', exportRouter)

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  consola.ready(`vault-server running at http://localhost:${PORT}`)
})
