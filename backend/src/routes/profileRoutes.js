const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { authenticate } = require('../middleware/auth')
const {
  getMyProfile,
  updateMyProfile,
  getPublicProfile
} = require('../controllers/profileController')

const router = express.Router()

router.get('/me', authenticate, asyncHandler(getMyProfile))
router.patch('/me', authenticate, asyncHandler(updateMyProfile))
router.get('/:userId', authenticate, asyncHandler(getPublicProfile))

module.exports = router
