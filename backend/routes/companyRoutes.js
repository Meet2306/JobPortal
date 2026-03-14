const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { roleMiddleware, verifiedMiddleware } = require('../middlewares/role');
const companyController = require('../controllers/companyController');

router.use(authMiddleware);
router.use(roleMiddleware(['company']));

router.get('/profile', companyController.getProfile);
router.put('/profile', companyController.updateProfile);
router.post('/request-edit', companyController.requestEdit);

router.get('/jobs', companyController.getJobs);

router.use(verifiedMiddleware); // Wait for TPO to approve company before posting 

router.post('/jobs', companyController.postJob);
router.get('/jobs/:jobId/applicants', companyController.getApplicants);
router.patch('/applications/:appId/status', companyController.updateApplicationStatus);

module.exports = router;
