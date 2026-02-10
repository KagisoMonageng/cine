const supabase = require('../config/db')

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
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, bio, institution, field_of_study, avatar_url, created_at, updated_at')
    .eq('id', req.user.userId)
    .single()

  if (error || !data) {
    return res.status(404).json({ message: 'Profile not found' })
  }

  return res.json({ data: mapUserRow(data) })
}

async function updateMyProfile (req, res) {
  const { fullName, bio, institution, fieldOfStudy, avatarUrl } = req.body

  const { data: current, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.userId)
    .single()

  if (fetchError || !current) {
    return res.status(404).json({ message: 'Profile not found' })
  }

  const { data, error } = await supabase
    .from('users')
    .update({
      full_name: fullName || current.full_name,
      bio: bio ?? current.bio,
      institution: institution ?? current.institution,
      field_of_study: fieldOfStudy ?? current.field_of_study,
      avatar_url: avatarUrl ?? current.avatar_url,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.userId)
    .select('id, full_name, email, role, bio, institution, field_of_study, avatar_url, created_at, updated_at')
    .single()

  if (error) throw error

  return res.json({ data: mapUserRow(data) })
}

async function getPublicProfile (req, res) {
  const { userId } = req.params

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, full_name, role, bio, institution, field_of_study, avatar_url, created_at')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return res.status(404).json({ message: 'User not found' })
  }

  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId)

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId)

  const { count: postsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', userId)

  return res.json({
    data: {
      ...profile,
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
      posts_count: postsCount || 0
    }
  })
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  getPublicProfile
}
