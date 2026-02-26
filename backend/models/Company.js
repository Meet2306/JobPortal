import mongoose from 'mongoose';
import User from './User.js';

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Please provide company name'],
      unique: true,
    },
    website: String,
    industry: String,
    companySize: {
      type: String,
      enum: ['Startup', 'Small', 'Medium', 'Large', 'Enterprise'],
    },
    location: String,
    country: String,
    description: String,

    // HR Contact Details
    hrName: {
      type: String,
      required: true,
    },
    hrPhone: String,
    hrEmail: {
      type: String,
      required: true,
    },

    // Company Profile Status
    profileVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: mongoose.Schema.Types.ObjectId,
    verificationDate: Date,
    rejectionReason: String,

    // Statistics
    jobsPosted: {
      type: Number,
      default: 0,
    },
    applicationsReceived: {
      type: Number,
      default: 0,
    },
    studentsHired: {
      type: Number,
      default: 0,
    },

    // Documents
    registrationNumber: String,
    gstNumber: String,
    panNumber: String,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

companySchema.index({ companyName: 1, profileVerified: 1 });

const Company = User.discriminator('company', companySchema);

export default Company;
