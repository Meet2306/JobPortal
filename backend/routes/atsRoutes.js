const express = require('express');
const router = express.Router();
const atsController = require('../controllers/atsController');

router.post('/evaluate-resume', atsController.evaluateResume);

module.exports = router;
