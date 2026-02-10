const pool = require('../config/db')

function mapUserRow (row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    bio: row.bio,
    institution: row.institution,
    fieldOfStudy: row.field_of_study,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

async function getMyProfile (req, res) {
  const result = await pool.query(
    `SELECT id, full_name, email, role, bio, institution, field_of_study, avatar_url, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [req.user.userId]
  )

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Profile not found' })
  }

  return res.json({ data: mapUserRow(result.rows[0]) })
}

async function updateMyProfile (req, res) {
  const { fullName, bio, institution, fieldOfStudy, avatarUrl } = req.body

  const current = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId])
  if (current.rowCount === 0) {
    return res.status(404).json({ message: 'Profile not found' })
  }

  const user = current.rows[0]

  const result = await pool.query(
    `UPDATE users
     SET full_name = $1,
         bio = $2,
         institution = $3,
         field_of_study = $4,
         avatar_url = $5,
         updated_at = NOW()
     WHERE id = $6
     RETURNING id, full_name, email, role, bio, institution, field_of_study, avatar_url, created_at, updated_at`,
    [
      fullName || user.full_name,
      bio ?? user.bio,
      institution ?? user.institution,
      fieldOfStudy ?? user.field_of_study,
      avatarUrl ?? user.avatar_url,
      req.user.userId
    ]
  )

  return res.json({ data: mapUserRow(result.rows[0]) })
}

async function getPublicProfile (req, res) {
  const { userId } = req.params

  const profileResult = await pool.query(
    `SELECT id, full_name, role, bio, institution, field_of_study, avatar_url, created_at
     FROM users
     WHERE id = $1`,
    [userId]
  )

  if (profileResult.rowCount === 0) {
    return res.status(404).json({ message: 'User not found' })
  }

  const statsResult = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM follows WHERE following_id = $1) AS followers_count,
      (SELECT COUNT(*) FROM follows WHERE follower_id = $1) AS following_count,
      (SELECT COUNT(*) FROM posts WHERE author_id = $1) AS posts_count`,
    [userId]
  )

  return res.json({
    data: {
      ...profileResult.rows[0],
      ...statsResult.rows[0]
    }
  })
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  getPublicProfile
}
