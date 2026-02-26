import express from 'express';
import {
  getPendingStudents,
  getVerifiedStudents,
  verifyStudentProfile,
  rejectStudentProfile,
  getPendingCompanies,
  verifyCompanyRegistration,
  rejectCompanyRegistration,
  getPendingJobApprovals,
  approveJobPosting,
  rejectJobPosting,
  getPlacementStatistics,
  adminOverrideApplicationStatus,
  getAuditLogs,
} from '../controllers/adminController.js';
import { verifyToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(verifyToken, authorizeRole('admin'));

// Student Management
router.get('/students/pending', getPendingStudents);
router.get('/students/verified', getVerifiedStudents);
router.post('/students/verify', verifyStudentProfile);
router.post('/students/reject', rejectStudentProfile);

// Company Management
router.get('/companies/pending', getPendingCompanies);
router.post('/companies/verify', verifyCompanyRegistration);
router.post('/companies/reject', rejectCompanyRegistration);

// Job Management
router.get('/jobs/pending-approval', getPendingJobApprovals);
router.post('/jobs/approve', approveJobPosting);
router.post('/jobs/reject', rejectJobPosting);

// Application Management
router.post('/applications/override-status', adminOverrideApplicationStatus);

// Analytics
router.get('/statistics', getPlacementStatistics);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

export default router;
