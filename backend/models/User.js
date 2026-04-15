const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'company', 'admin'],
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false // Admin verifies students and companies
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  loginAttempts: {
    type: Number,
    required: true,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
