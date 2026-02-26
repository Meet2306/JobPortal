import express from 'express';
import {
  getProfile,
  updateProfile,
  uploadResume,
  getEligibleJobs,
  applyForJob,
  getApplicationStatus,
} from '../controllers/studentController.js';
import { verifyToken, authorizeRole, requireVerifiedStudent } from '../middleware/auth.js';

const router = express.Router();

// All student routes require authentication and student role
router.use(verifyToken, authorizeRole('student'));

// Profile Management
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/resume', uploadResume);

// Job Applications
router.get('/eligible-jobs', getEligibleJobs);
router.post('/apply-job', applyForJob);
router.get('/applications', getApplicationStatus);

export default router;
