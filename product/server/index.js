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
const { getValuation } = require('./routes/valuation')
const { dealCheck } = require('./routes/dealCheck')
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

// Valuation route — auth-guarded; returns comp-backed estimate for a make/model/condition
const valuationRouter = express.Router()
valuationRouter.get('/', verifyFirebaseToken, getValuation)
app.use('/api/valuation', valuationRouter)

// Deal-check route — auth-guarded; returns valuation + verdict for an asking price
const dealCheckRouter = express.Router()
dealCheckRouter.post('/', verifyFirebaseToken, dealCheck)
app.use('/api/deal-check', dealCheckRouter)

// Centralized error handler. Auth middleware fails with next('Not authorized');
// map that to a 401. Without this, Express's default handler returns 500 for any
// next(err), so auth failures looked like server errors.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err === 'Not authorized') {
    return res.status(401).json('Not authorized')
  }
  consola.error('[vault-server] unhandled error', err)
  return res.status(500).json('Error.')
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  consola.ready(`vault-server running at http://localhost:${PORT}`)
})
