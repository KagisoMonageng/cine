const express = require('express')
const asyncHandler = require('../utils/asyncHandler')
const upload = require('../middleware/upload')
const { authenticate, authorizeRoles } = require('../middleware/auth')
const {
  applyForBursary,
  uploadApplicationDocument,
  listMyApplications,
  listProviderApplications,
  updateApplicationStatus,
  listApplicationDocuments
} = require('../controllers/applicationController')

const router = express.Router()

router.post('/', authenticate, authorizeRoles('learner'), asyncHandler(applyForBursary))
router.get('/mine', authenticate, authorizeRoles('learner'), asyncHandler(listMyApplications))
router.post('/:applicationId/documents', authenticate, authorizeRoles('learner'), upload.single('document'), asyncHandler(uploadApplicationDocument))
router.get('/:applicationId/documents', authenticate, asyncHandler(listApplicationDocuments))

router.get('/provider/bursary/:bursaryId', authenticate, authorizeRoles('provider'), asyncHandler(listProviderApplications))
router.patch('/provider/:applicationId/status', authenticate, authorizeRoles('provider'), asyncHandler(updateApplicationStatus))

module.exports = router
