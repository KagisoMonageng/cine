const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { authenticate } = require('../middleware/auth')
const {
  followUser,
  unfollowUser,
  listFollowing,
  listFollowers,
  createPost,
  listFeed,
  likePost,
  unlikePost
} = require('../controllers/socialController')

const router = express.Router()

router.use(authenticate)

router.post('/follow/:userId', asyncHandler(followUser))
router.delete('/follow/:userId', asyncHandler(unfollowUser))
router.get('/followers', asyncHandler(listFollowers))
router.get('/following', asyncHandler(listFollowing))

router.post('/posts', asyncHandler(createPost))
router.get('/feed', asyncHandler(listFeed))
router.post('/posts/:postId/like', asyncHandler(likePost))
router.delete('/posts/:postId/like', asyncHandler(unlikePost))

module.exports = router
