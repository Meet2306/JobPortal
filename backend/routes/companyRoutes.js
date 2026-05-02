const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { roleMiddleware } = require('../middlewares/role');
const { requireApprovedProfile } = require('../middlewares/profileCheck');
const companyController = require('../controllers/companyController');
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
        cb(null, `company-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

router.use(authMiddleware);
router.use(roleMiddleware(['company']));

router.get('/profile', companyController.getProfile);
router.put('/profile', companyController.updateProfile);
router.post('/request-edit', companyController.requestEdit);
router.post('/submit-profile', companyController.submitProfileForApproval);
router.post('/upload-logo', upload.single('logo'), companyController.uploadLogo);
router.post('/upload-registration', upload.single('registration'), companyController.uploadRegistrationDocument);

router.get('/jobs', companyController.getJobs);

router.use(requireApprovedProfile); // Wait for TPO to approve company before posting 

router.post('/jobs', companyController.postJob);
router.get('/applicants', companyController.getAllApplicants);
router.get('/jobs/:jobId/applicants', companyController.getApplicants);
router.patch('/applications/:appId/status', companyController.updateApplicationStatus);

module.exports = router;
