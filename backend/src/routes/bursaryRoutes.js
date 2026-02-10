const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const { authenticate, authorizeRoles } = require('../middleware/auth')
const {
  listBursaries,
  createBursary,
  updateBursary,
  closeBursary
} = require('../controllers/bursaryController')

const router = express.Router()

router.get('/', asyncHandler(listBursaries))
router.post('/', authenticate, authorizeRoles('provider'), asyncHandler(createBursary))
router.patch('/:id', authenticate, authorizeRoles('provider'), asyncHandler(updateBursary))
router.patch('/:id/close', authenticate, authorizeRoles('provider'), asyncHandler(closeBursary))

module.exports = router
