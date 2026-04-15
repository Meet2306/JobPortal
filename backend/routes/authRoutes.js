const express = require('express');
const router = express.Router();
const { register, login, logout, me, forgotPassword, resetPassword, getCaptcha, verifyEmail } = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: { error: 'Too many login attempts from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.get('/captcha', getCaptcha);
router.get('/verify-email/:token', verifyEmail);
router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
