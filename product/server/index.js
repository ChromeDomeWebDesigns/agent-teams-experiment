require('dotenv').config()

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const consola = require('consola')

const { health } = require('./routes/health')

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

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  consola.ready(`vault-server running at http://localhost:${PORT}`)
})
