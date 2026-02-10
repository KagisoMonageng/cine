const supabase = require('../config/db')

async function followUser (req, res) {
  const { userId } = req.params

  if (userId === req.user.userId) {
    return res.status(400).json({ message: 'You cannot follow yourself' })
  }

  const { data: target, error: targetError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single()

  if (targetError || !target) {
    return res.status(404).json({ message: 'User not found' })
  }

  const { error } = await supabase
    .from('follows')
    .insert({
      follower_id: req.user.userId,
      following_id: userId
    })

  if (error && error.code !== '23505') throw error

  return res.status(201).json({ message: 'Now following user' })
}

async function unfollowUser (req, res) {
  const { userId } = req.params

  await supabase
    .from('follows')
    .delete()
    .eq('follower_id', req.user.userId)
    .eq('following_id', userId)

  return res.json({ message: 'Unfollowed user' })
}

async function listFollowing (req, res) {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      created_at,
      users!following_id (id, full_name, role, avatar_url)
    `)
    .eq('follower_id', req.user.userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const formatted = data.map(f => f.users)

  return res.json({ data: formatted })
}

async function listFollowers (req, res) {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      created_at,
      users!follower_id (id, full_name, role, avatar_url)
    `)
    .eq('following_id', req.user.userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const formatted = data.map(f => f.users)

  return res.json({ data: formatted })
}

async function createPost (req, res) {
  const { content } = req.body

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'content is required' })
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: req.user.userId,
      content: content.trim()
    })
    .select()
    .single()

  if (error) throw error

  return res.status(201).json({ data })
}

async function listFeed (req, res) {
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', req.user.userId)

  const followingIds = following?.map(f => f.following_id) || []
  const authorIds = [req.user.userId, ...followingIds]

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id, author_id, content, created_at, updated_at,
      users!author_id (full_name, avatar_url)
    `)
    .in('author_id', authorIds)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error

  const postsWithLikes = await Promise.all(posts.map(async (post) => {
    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)

    const { data: myLike } = await supabase
      .from('post_likes')
      .select('user_id')
      .eq('post_id', post.id)
      .eq('user_id', req.user.userId)
      .single()

    return {
      id: post.id,
      author_id: post.author_id,
      content: post.content,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author_name: post.users?.full_name,
      avatar_url: post.users?.avatar_url,
      likes_count: count || 0,
      liked_by_me: !!myLike
    }
  }))

  return res.json({ data: postsWithLikes })
}

async function likePost (req, res) {
  const { postId } = req.params

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id')
    .eq('id', postId)
    .single()

  if (postError || !post) {
    return res.status(404).json({ message: 'Post not found' })
  }

  const { error } = await supabase
    .from('post_likes')
    .insert({
      user_id: req.user.userId,
      post_id: postId
    })

  if (error && error.code !== '23505') throw error

  return res.status(201).json({ message: 'Post liked' })
}

async function unlikePost (req, res) {
  const { postId } = req.params

  await supabase
    .from('post_likes')
    .delete()
    .eq('user_id', req.user.userId)
    .eq('post_id', postId)

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
