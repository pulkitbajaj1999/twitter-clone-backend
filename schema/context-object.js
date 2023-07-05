const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret'
const User = require('../models/user')

const contextObject = async ({ req }) => {
  const authHeader = req.headers.authorization
  const token = authHeader ? authHeader.split(' ')[1] : null

  // if token not provided then continue to next middleware
  if (!token) return {}

  // else verify token and extract user-info
  const decoded = jwt.verify(token, JWT_SECRET)
  if (decoded.exp <= Date.now() / 1000) return {}

  const { userId } = decoded
  return { userId, isAuthenticated: true }
}

module.exports = contextObject
