const path = require('path')
const supabase = require('../config/db')

async function applyForBursary (req, res) {
  const { bursaryId, motivation } = req.body

  if (!bursaryId || !motivation) {
    return res.status(400).json({ message: 'bursaryId and motivation are required' })
  }

  const { data: bursary, error: bursaryError } = await supabase
    .from('bursaries')
    .select('id, status')
    .eq('id', bursaryId)
    .single()

  if (bursaryError || !bursary) {
    return res.status(404).json({ message: 'Bursary not found' })
  }

  if (bursary.status !== 'open') {
    return res.status(400).json({ message: 'Bursary is not accepting applications' })
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      bursary_id: bursaryId,
      learner_id: req.user.userId,
      motivation
    })
    .select()
    .single()

  if (error) throw error

  return res.status(201).json({ data })
}

async function uploadApplicationDocument (req, res) {
  const { applicationId } = req.params

  if (!req.file) {
    return res.status(400).json({ message: 'Document is required' })
  }

  const { data: ownership, error: ownershipError } = await supabase
    .from('applications')
    .select('id')
    .eq('id', applicationId)
    .eq('learner_id', req.user.userId)
    .single()

  if (ownershipError || !ownership) {
    return res.status(404).json({ message: 'Application not found' })
  }

  const { data, error } = await supabase
    .from('application_documents')
    .insert({
      application_id: applicationId,
      original_file_name: req.file.originalname,
      storage_file_name: path.basename(req.file.path),
      mime_type: req.file.mimetype,
      size_bytes: req.file.size
    })
    .select()
    .single()

  if (error) throw error

  return res.status(201).json({ data })
}

async function listMyApplications (req, res) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      id, bursary_id, status, created_at, updated_at,
      bursaries!bursary_id (title)
    `)
    .eq('learner_id', req.user.userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const formatted = data.map(a => ({
    ...a,
    bursary_title: a.bursaries?.title
  }))

  return res.json({ data: formatted })
}

async function listProviderApplications (req, res) {
  const { bursaryId } = req.params

  const { data, error } = await supabase
    .from('applications')
    .select(`
      id, motivation, status, created_at,
      users!learner_id (id, full_name, email),
      bursaries!bursary_id (provider_id)
    `)
    .eq('bursary_id', bursaryId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const filtered = data.filter(a => a.bursaries?.provider_id === req.user.userId)

  const formatted = filtered.map(a => ({
    id: a.id,
    motivation: a.motivation,
    status: a.status,
    created_at: a.created_at,
    learner_id: a.users?.id,
    full_name: a.users?.full_name,
    email: a.users?.email
  }))

  return res.json({ data: formatted })
}

async function updateApplicationStatus (req, res) {
  const { applicationId } = req.params
  const { status } = req.body
  const allowed = new Set(['submitted', 'under_review', 'approved', 'rejected'])

  if (!allowed.has(status)) {
    return res.status(400).json({ message: 'Invalid status value' })
  }

  const { data: app, error: fetchError } = await supabase
    .from('applications')
    .select('id, bursaries!bursary_id (provider_id)')
    .eq('id', applicationId)
    .single()

  if (fetchError || !app || app.bursaries?.provider_id !== req.user.userId) {
    return res.status(404).json({ message: 'Application not found' })
  }

  const { data, error } = await supabase
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', applicationId)
    .select()
    .single()

  if (error) throw error

  return res.json({ data })
}

async function listApplicationDocuments (req, res) {
  const { applicationId } = req.params

  const { data, error } = await supabase
    .from('application_documents')
    .select(`
      id, original_file_name, storage_file_name, mime_type, size_bytes, created_at,
      applications!application_id (learner_id, bursaries!bursary_id (provider_id))
    `)
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const filtered = data.filter(d => {
    const app = d.applications
    return app?.learner_id === req.user.userId || app?.bursaries?.provider_id === req.user.userId
  })

  return res.json({ data: filtered })
}

module.exports = {
  applyForBursary,
  uploadApplicationDocument,
  listMyApplications,
  listProviderApplications,
  updateApplicationStatus,
  listApplicationDocuments
}
