const env = require('../config/env')

module.exports = function errorHandler (err, req, res, next) {
  const status = err.statusCode || 500
  const payload = {
    message: err.message || 'Internal server error'
  }

  if (env.nodeEnv !== 'production') {
    payload.stack = err.stack
  }

  if (err.code === '23505') {
    payload.message = 'Resource already exists'
    return res.status(409).json(payload)
  }

  if (err.code === '22P02') {
    payload.message = 'Invalid identifier format'
    return res.status(400).json(payload)
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    payload.message = 'Uploaded file exceeds configured size limit'
    return res.status(400).json(payload)
  }

  return res.status(status).json(payload)
}
