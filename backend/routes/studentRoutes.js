const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { roleMiddleware, verifiedMiddleware } = require('../middlewares/role');
const { getProfile, updateProfile, getEligibleJobs, applyForJob, getApplications, requestEditPermission, uploadPhoto, uploadResume } = require('../controllers/studentController');
const { createInterview, submitAnswer, getInterviews, getInterviewById } = require('../controllers/mockInterviewController');
const multer = require('multer');
const path = require('path');

const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
        cb(null, `profile-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

router.use(authMiddleware);
router.use(roleMiddleware(['student']));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/request-edit', requestEditPermission);
router.post('/upload-photo', upload.single('photo'), uploadPhoto);
router.post('/upload-resume', upload.single('resume'), uploadResume);

router.use(verifiedMiddleware); // Verify lock

router.get('/jobs/eligible', getEligibleJobs);
router.post('/jobs/:jobId/apply', applyForJob);
router.get('/applications', getApplications);

// Mock Interview Routes
router.post('/mock-interview', createInterview);
router.get('/mock-interview', getInterviews);
router.get('/mock-interview/:id', getInterviewById);
router.post('/mock-interview/:id/question/:questionId/answer', submitAnswer);

module.exports = router;
