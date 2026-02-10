const pool = require('../config/db')

async function listBursaries (req, res) {
  const result = await pool.query(
    `SELECT b.id, b.provider_id, b.title, b.description, b.amount, b.deadline, b.status, b.created_at,
            u.full_name AS provider_name
     FROM bursaries b
     JOIN users u ON u.id = b.provider_id
     WHERE b.status = 'open'
     ORDER BY b.deadline ASC`
  )

  return res.json({ data: result.rows })
}

async function createBursary (req, res) {
  const { title, description, amount, deadline } = req.body

  if (!title || !description || !amount || !deadline) {
    return res.status(400).json({ message: 'title, description, amount and deadline are required' })
  }

  const result = await pool.query(
    `INSERT INTO bursaries (provider_id, title, description, amount, deadline)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [req.user.userId, title, description, amount, deadline]
  )

  return res.status(201).json({ data: result.rows[0] })
}

async function updateBursary (req, res) {
  const { id } = req.params
  const { title, description, amount, deadline, status } = req.body

  const current = await pool.query('SELECT * FROM bursaries WHERE id = $1 AND provider_id = $2', [id, req.user.userId])
  if (current.rowCount === 0) {
    return res.status(404).json({ message: 'Bursary not found' })
  }

  const bursary = current.rows[0]

  const result = await pool.query(
    `UPDATE bursaries
     SET title = $1,
         description = $2,
         amount = $3,
         deadline = $4,
         status = $5,
         updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [
      title || bursary.title,
      description || bursary.description,
      amount || bursary.amount,
      deadline || bursary.deadline,
      status || bursary.status,
      id
    ]
  )

  return res.json({ data: result.rows[0] })
}

async function closeBursary (req, res) {
  const { id } = req.params

  const result = await pool.query(
    `UPDATE bursaries
     SET status = 'closed', updated_at = NOW()
     WHERE id = $1 AND provider_id = $2
     RETURNING *`,
    [id, req.user.userId]
  )

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Bursary not found' })
  }

  return res.json({ data: result.rows[0] })
}

module.exports = {
  listBursaries,
  createBursary,
  updateBursary,
  closeBursary
}
