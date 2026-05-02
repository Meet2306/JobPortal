const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { roleMiddleware } = require('../middlewares/role');
const adminController = require('../controllers/adminController');

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/pending', adminController.getPendingApprovals);
router.patch('/profiles/student/:id/approve', adminController.approveStudentProfile);
router.patch('/profiles/student/:id/reject', adminController.rejectStudentProfile);
router.patch('/profiles/company/:id/approve', adminController.approveCompanyProfile);
router.patch('/profiles/company/:id/reject', adminController.rejectCompanyProfile);
router.patch('/users/:userId/verify', adminController.verifyUser);
router.delete('/users/:userId/reject', adminController.rejectUser);
router.patch('/profiles/:profileId/edit-permission', adminController.handleEditRequest);
router.patch('/jobs/:jobId/approve', adminController.approveJob);
router.get('/analytics', adminController.getAnalytics);
router.get('/users', adminController.getAllUsers);
router.get('/applications', adminController.getAllApplications);
router.get('/students-tracking', adminController.getAllStudentsTracker);
module.exports = router;
