import express from 'express';
import {
  createJobPosting,
  submitJobForApproval,
  getCompanyJobs,
  getJobApplicants,
  updateApplicationStatus,
  scheduleInterview,
} from '../controllers/jobController.js';
import { verifyToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// All company routes require authentication and company role
router.use(verifyToken, authorizeRole('company'));

// Job Management
router.post('/create-job', createJobPosting);
router.post('/submit-job', submitJobForApproval);
router.get('/jobs', getCompanyJobs);
router.get('/applicants/:jobId', getJobApplicants);

// Application Management
router.put('/update-application-status', updateApplicationStatus);
router.post('/schedule-interview', scheduleInterview);

export default router;
