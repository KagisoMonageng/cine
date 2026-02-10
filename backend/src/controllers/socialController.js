const pool = require('../config/db')

async function followUser (req, res) {
  const { userId } = req.params

  if (userId === req.user.userId) {
    return res.status(400).json({ message: 'You cannot follow yourself' })
  }

  const target = await pool.query('SELECT id FROM users WHERE id = $1', [userId])
  if (target.rowCount === 0) {
    return res.status(404).json({ message: 'User not found' })
  }

  await pool.query(
    `INSERT INTO follows (follower_id, following_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [req.user.userId, userId]
  )

  return res.status(201).json({ message: 'Now following user' })
}

async function unfollowUser (req, res) {
  const { userId } = req.params

  await pool.query(
    'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
    [req.user.userId, userId]
  )

  return res.json({ message: 'Unfollowed user' })
}

async function listFollowing (req, res) {
  const result = await pool.query(
    `SELECT u.id, u.full_name, u.role, u.avatar_url
     FROM follows f
     JOIN users u ON u.id = f.following_id
     WHERE f.follower_id = $1
     ORDER BY f.created_at DESC`,
    [req.user.userId]
  )

  return res.json({ data: result.rows })
}

async function listFollowers (req, res) {
  const result = await pool.query(
    `SELECT u.id, u.full_name, u.role, u.avatar_url
     FROM follows f
     JOIN users u ON u.id = f.follower_id
     WHERE f.following_id = $1
     ORDER BY f.created_at DESC`,
    [req.user.userId]
  )

  return res.json({ data: result.rows })
}

async function createPost (req, res) {
  const { content } = req.body

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'content is required' })
  }

  const result = await pool.query(
    `INSERT INTO posts (author_id, content)
     VALUES ($1, $2)
     RETURNING *`,
    [req.user.userId, content.trim()]
  )

  return res.status(201).json({ data: result.rows[0] })
}

async function listFeed (req, res) {
  const result = await pool.query(
    `SELECT p.id, p.author_id, p.content, p.created_at, p.updated_at,
            u.full_name AS author_name, u.avatar_url,
            COUNT(pl.user_id)::int AS likes_count,
            BOOL_OR(pl.user_id = $1) AS liked_by_me
     FROM posts p
     JOIN users u ON u.id = p.author_id
     LEFT JOIN post_likes pl ON pl.post_id = p.id
     WHERE p.author_id = $1
        OR p.author_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
     GROUP BY p.id, u.full_name, u.avatar_url
     ORDER BY p.created_at DESC
     LIMIT 100`,
    [req.user.userId]
  )

  return res.json({ data: result.rows })
}

async function likePost (req, res) {
  const { postId } = req.params

  const post = await pool.query('SELECT id FROM posts WHERE id = $1', [postId])
  if (post.rowCount === 0) {
    return res.status(404).json({ message: 'Post not found' })
  }

  await pool.query(
    `INSERT INTO post_likes (user_id, post_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [req.user.userId, postId]
  )

  return res.status(201).json({ message: 'Post liked' })
}

async function unlikePost (req, res) {
  const { postId } = req.params

  await pool.query(
    'DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2',
    [req.user.userId, postId]
  )

  return res.json({ message: 'Post unliked' })
}

module.exports = {
  followUser,
  unfollowUser,
  listFollowing,
  listFollowers,
  createPost,
  listFeed,
  likePost,
  unlikePost
}
