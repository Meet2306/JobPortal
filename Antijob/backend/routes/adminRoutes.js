const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { roleMiddleware } = require('../middlewares/role');
const adminController = require('../controllers/adminController');

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/pending', adminController.getPendingApprovals);
router.patch('/users/:userId/verify', adminController.verifyUser);
router.delete('/users/:userId/reject', adminController.rejectUser);
router.patch('/profiles/:profileId/edit-permission', adminController.handleEditRequest);
router.patch('/jobs/:jobId/approve', adminController.approveJob);
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
