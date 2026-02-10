const { verifyToken } = require('../utils/jwt')

function unauthorized (message) {
  const error = new Error(message)
  error.statusCode = 401
  return error
}

function forbidden (message) {
  const error = new Error(message)
  error.statusCode = 403
  return error
}

function authenticate (req, res, next) {
  const authHeader = req.headers.authorization || ''
  const [, token] = authHeader.split(' ')

  if (!token) {
    return next(unauthorized('Missing bearer token'))
  }

  try {
    const decoded = verifyToken(token)
    req.user = decoded
    return next()
  } catch (error) {
    return next(unauthorized('Invalid or expired token'))
  }
}

function authorizeRoles (...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(unauthorized('Missing authenticated user'))
    }

    if (!roles.includes(req.user.role)) {
      return next(forbidden('Insufficient permission for this resource'))
    }

    return next()
  }
}

module.exports = {
  authenticate,
  authorizeRoles
}
