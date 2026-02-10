const bcrypt = require('bcrypt')
const supabase = require('../config/db')
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

  const { data, error } = await supabase
    .from('users')
    .insert({
      full_name: fullName,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role
    })
    .select()
    .single()

  if (error) throw error

  const token = signToken({ userId: data.id, role: data.role })
  return res.status(201).json({ user: sanitizeUser(data), token })
}

async function login (req, res) {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' })
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, bio, institution, field_of_study, avatar_url, password_hash, created_at')
    .eq('email', email.toLowerCase())
    .single()

  if (error || !data) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const isMatch = await bcrypt.compare(password, data.password_hash)
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = signToken({ userId: data.id, role: data.role })
  return res.json({ user: sanitizeUser(data), token })
}

module.exports = {
  register,
  login
}
