const express = require('express');
const router = express.Router();
const { register, login, logout, me, forgotPassword, resetPassword, getCaptcha, verifyEmail } = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

router.get('/captcha', getCaptcha);
router.get('/verify-email/:token', verifyEmail);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
