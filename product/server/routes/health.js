const health = (req, res) => {
  res.json({ status: 'ok', service: 'vault-server' })
}

module.exports = { health }
