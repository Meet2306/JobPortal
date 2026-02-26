const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { roleMiddleware, verifiedMiddleware } = require('../middlewares/role');
const { getProfile, updateProfile, getEligibleJobs, applyForJob, getApplications } = require('../controllers/studentController');

router.use(authMiddleware);
router.use(roleMiddleware(['student']));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

router.use(verifiedMiddleware); // Verify lock

router.get('/jobs/eligible', getEligibleJobs);
router.post('/jobs/:jobId/apply', applyForJob);
router.get('/applications', getApplications);

module.exports = router;
