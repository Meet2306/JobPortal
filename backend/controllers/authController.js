import User from '../models/User.js';
import Student from '../models/Student.js';
import Company from '../models/Company.js';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../services/emailService.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Generate JWT Token
 */
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Student Registration
 */
export const registerStudent = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, branch, semester, passingYear } = req.body;

    // Validation
    if (!name || !email || !password || !branch || !semester || !passingYear) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, branch, semester, and passingYear',
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create student
    const student = await Student.create({
      name,
      email,
      password,
      phoneNumber,
      branch,
      semester,
      passingYear,
      role: 'student',
      isVerified: false,
      profileCompleted: false,
      canApply: false,
    });

    const token = generateToken(student._id, 'student');

    // Send registration email
    await sendEmail(email, 'studentRegistration', name, email, password);

    // Audit log
    await AuditLog.create({
      action: 'USER_REGISTERED',
      performedBy: student._id,
      performedByRole: 'student',
      targetUser: student._id,
    });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully. Please check email for credentials.',
      token,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
      },
    });
  } catch (error) {
    console.error(error); // Log full error for debugging
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

/**
 * Company Registration
 */
export const registerCompany = async (req, res) => {
  try {
    const { name, email, password, companyName, hrName, hrEmail, hrPhone } = req.body;

    // Validation
    if (!name || !email || !password || !companyName || !hrEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Check if company name exists
    const existingCompany = await Company.findOne({ companyName });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company name already registered',
      });
    }

    // Create company
    const company = await Company.create({
      name,
      email,
      password,
      companyName,
      hrName,
      hrEmail,
      hrPhone,
      role: 'company',
      isVerified: false,
      profileVerified: false,
    });

    const token = generateToken(company._id, 'company');

    // Send registration email
    await sendEmail(email, 'companyRegistration', companyName, email);

    // Audit log
    await AuditLog.create({
      action: 'USER_REGISTERED',
      performedBy: company._id,
      performedByRole: 'company',
      targetCompany: company._id,
    });

    res.status(201).json({
      success: true,
      message: 'Company registered successfully. Awaiting admin approval.',
      token,
      user: {
        id: company._id,
        name: company.name,
        companyName: company.companyName,
        email: company.email,
        role: company.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

/**
 * Login (Universal)
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    // For company - check if approved
    if (user.role === 'company' && !user.profileVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your company profile is awaiting admin approval',
      });
    }

    const token = generateToken(user._id, user.role);

    // Audit log
    await AuditLog.create({
      action: 'USER_LOGGED_IN',
      performedBy: user._id,
      performedByRole: user.role,
    });

    // Return user data (fetch fresh to get all fields)
    const userData = await User.findById(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        isVerified: userData.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

/**
 * Change Password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isValid = await user.matchPassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Audit log
    await AuditLog.create({
      action: 'PASSWORD_CHANGED',
      performedBy: req.userId,
      performedByRole: req.userRole,
      targetUser: req.userId,
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Password change failed',
      error: error.message,
    });
  }
};

export default {
  registerStudent,
  registerCompany,
  login,
  changePassword,
};
