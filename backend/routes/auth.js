import express from 'express';
import {
  registerStudent,
  registerCompany,
  login,
  changePassword,
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register/student', registerStudent);
router.post('/register/company', registerCompany);
router.post('/login', login);

// Protected routes
router.post('/change-password', verifyToken, changePassword);

export default router;
