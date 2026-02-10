const bcrypt = require('bcrypt')
const pool = require('../config/db')
const { signToken } = require('../utils/jwt')

const allowedRoles = new Set(['learner', 'provider'])

function sanitizeUser (user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    bio: user.bio,
    institution: user.institution,
    fieldOfStudy: user.field_of_study,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at
  }
}

async function register (req, res) {
  const { fullName, email, password, role } = req.body

  if (!fullName || !email || !password || !role) {
    return res.status(400).json({ message: 'fullName, email, password and role are required' })
  }

  if (!allowedRoles.has(role)) {
    return res.status(400).json({ message: 'Invalid role. Allowed values: learner, provider' })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const query = `
    INSERT INTO users (full_name, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, full_name, email, role, bio, institution, field_of_study, avatar_url, created_at
  `

  const result = await pool.query(query, [fullName, email.toLowerCase(), passwordHash, role])
  const user = result.rows[0]
  const token = signToken({ userId: user.id, role: user.role })

  return res.status(201).json({ user: sanitizeUser(user), token })
}

async function login (req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' })
  }

  const result = await pool.query(
    'SELECT id, full_name, email, role, bio, institution, field_of_study, avatar_url, password_hash, created_at FROM users WHERE email = $1',
    [email.toLowerCase()]
  )

  const user = result.rows[0]
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const isMatch = await bcrypt.compare(password, user.password_hash)
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = signToken({ userId: user.id, role: user.role })
  return res.json({ user: sanitizeUser(user), token })
}

module.exports = {
  register,
  login
}
