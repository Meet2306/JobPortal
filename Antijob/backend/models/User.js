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
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
