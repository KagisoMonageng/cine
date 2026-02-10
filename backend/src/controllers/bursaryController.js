const supabase = require('../config/db')

async function listBursaries (req, res) {
  const { data, error } = await supabase
    .from('bursaries')
    .select(`
      id, provider_id, title, description, amount, deadline, status, created_at,
      users!provider_id (full_name)
    `)
    .eq('status', 'open')
    .order('deadline', { ascending: true })

  if (error) throw error

  const formatted = data.map(b => ({
    ...b,
    provider_name: b.users?.full_name
  }))

  return res.json({ data: formatted })
}

async function createBursary (req, res) {
  const { title, description, amount, deadline } = req.body

  if (!title || !description || !amount || !deadline) {
    return res.status(400).json({ message: 'title, description, amount and deadline are required' })
  }

  const { data, error } = await supabase
    .from('bursaries')
    .insert({
      provider_id: req.user.userId,
      title,
      description,
      amount,
      deadline
    })
    .select()
    .single()

  if (error) throw error

  return res.status(201).json({ data })
}

async function updateBursary (req, res) {
  const { id } = req.params
  const { title, description, amount, deadline, status } = req.body

  const { data: current, error: fetchError } = await supabase
    .from('bursaries')
    .select('*')
    .eq('id', id)
    .eq('provider_id', req.user.userId)
    .single()

  if (fetchError || !current) {
    return res.status(404).json({ message: 'Bursary not found' })
  }

  const { data, error } = await supabase
    .from('bursaries')
    .update({
      title: title || current.title,
      description: description || current.description,
      amount: amount || current.amount,
      deadline: deadline || current.deadline,
      status: status || current.status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return res.json({ data })
}

async function closeBursary (req, res) {
  const { id } = req.params

  const { data, error } = await supabase
    .from('bursaries')
    .update({ status: 'closed', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('provider_id', req.user.userId)
    .select()
    .single()

  if (error || !data) {
    return res.status(404).json({ message: 'Bursary not found' })
  }

  return res.json({ data })
}

module.exports = {
  listBursaries,
  createBursary,
  updateBursary,
  closeBursary
}
