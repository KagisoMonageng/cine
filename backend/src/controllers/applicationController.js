const path = require('path')
const pool = require('../config/db')

async function applyForBursary (req, res) {
  const { bursaryId, motivation } = req.body

  if (!bursaryId || !motivation) {
    return res.status(400).json({ message: 'bursaryId and motivation are required' })
  }

  const bursaryResult = await pool.query('SELECT id, status FROM bursaries WHERE id = $1', [bursaryId])
  if (bursaryResult.rowCount === 0) {
    return res.status(404).json({ message: 'Bursary not found' })
  }

  if (bursaryResult.rows[0].status !== 'open') {
    return res.status(400).json({ message: 'Bursary is not accepting applications' })
  }

  const inserted = await pool.query(
    `INSERT INTO applications (bursary_id, learner_id, motivation)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [bursaryId, req.user.userId, motivation]
  )

  return res.status(201).json({ data: inserted.rows[0] })
}

async function uploadApplicationDocument (req, res) {
  const { applicationId } = req.params

  if (!req.file) {
    return res.status(400).json({ message: 'Document is required' })
  }

  const ownership = await pool.query(
    'SELECT id FROM applications WHERE id = $1 AND learner_id = $2',
    [applicationId, req.user.userId]
  )

  if (ownership.rowCount === 0) {
    return res.status(404).json({ message: 'Application not found' })
  }

  const result = await pool.query(
    `INSERT INTO application_documents
      (application_id, original_file_name, storage_file_name, mime_type, size_bytes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      applicationId,
      req.file.originalname,
      path.basename(req.file.path),
      req.file.mimetype,
      req.file.size
    ]
  )

  return res.status(201).json({ data: result.rows[0] })
}

async function listMyApplications (req, res) {
  const result = await pool.query(
    `SELECT a.id, a.bursary_id, a.status, a.created_at, a.updated_at, b.title AS bursary_title
     FROM applications a
     JOIN bursaries b ON b.id = a.bursary_id
     WHERE a.learner_id = $1
     ORDER BY a.created_at DESC`,
    [req.user.userId]
  )

  return res.json({ data: result.rows })
}

async function listProviderApplications (req, res) {
  const { bursaryId } = req.params

  const result = await pool.query(
    `SELECT a.id, a.motivation, a.status, a.created_at, u.id AS learner_id, u.full_name, u.email
     FROM applications a
     JOIN users u ON u.id = a.learner_id
     JOIN bursaries b ON b.id = a.bursary_id
     WHERE b.provider_id = $1 AND b.id = $2
     ORDER BY a.created_at DESC`,
    [req.user.userId, bursaryId]
  )

  return res.json({ data: result.rows })
}

async function updateApplicationStatus (req, res) {
  const { applicationId } = req.params
  const { status } = req.body
  const allowed = new Set(['submitted', 'under_review', 'approved', 'rejected'])

  if (!allowed.has(status)) {
    return res.status(400).json({ message: 'Invalid status value' })
  }

  const result = await pool.query(
    `UPDATE applications a
     SET status = $1, updated_at = NOW()
     FROM bursaries b
     WHERE a.id = $2
       AND b.id = a.bursary_id
       AND b.provider_id = $3
     RETURNING a.*`,
    [status, applicationId, req.user.userId]
  )

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Application not found' })
  }

  return res.json({ data: result.rows[0] })
}

async function listApplicationDocuments (req, res) {
  const { applicationId } = req.params

  const result = await pool.query(
    `SELECT d.id, d.original_file_name, d.storage_file_name, d.mime_type, d.size_bytes, d.created_at
     FROM application_documents d
     JOIN applications a ON a.id = d.application_id
     JOIN bursaries b ON b.id = a.bursary_id
     WHERE d.application_id = $1
       AND (a.learner_id = $2 OR b.provider_id = $2)
     ORDER BY d.created_at DESC`,
    [applicationId, req.user.userId]
  )

  return res.json({ data: result.rows })
}

module.exports = {
  applyForBursary,
  uploadApplicationDocument,
  listMyApplications,
  listProviderApplications,
  updateApplicationStatus,
  listApplicationDocuments
}
