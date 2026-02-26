import mongoose from 'mongoose';
import User from './User.js';

const studentSchema = new mongoose.Schema(
  {
    rollNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    address: String,
    city: String,
    state: String,
    pincode: String,

    // Academic Details
    branch: {
      type: String,
      enum: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'OTHER'],
      required: [true, 'Please select a branch'],
    },
    semester: {
      type: Number,
      enum: [1, 2, 3, 4, 5, 6, 7, 8],
      required: true,
    },
    cgpa: {
      type: Number,
      min: 0,
      max: 10,
    },
    backlogs: {
      type: Number,
      default: 0,
      min: 0,
    },
    passingYear: {
      type: Number,
      required: true,
    },
    collegeRollNumber: String,
    admissionNumber: String,

    // Resume
    resumePath: String,
    resumeFileName: String,

    // Profile Status
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    profileVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: mongoose.Schema.Types.ObjectId,
    verificationDate: Date,

    // Placement Status
    placementStatus: {
      type: String,
      enum: ['Unplaced', 'Placed', 'Offer Received'],
      default: 'Unplaced',
    },
    placedCompany: mongoose.Schema.Types.ObjectId,
    package: Number, // in LPA

    // Restrictions
    canApply: {
      type: Boolean,
      default: false, // Can only apply after profile verification
    },

    // Track applications
    appliedJobs: [
      {
        jobId: mongoose.Schema.Types.ObjectId,
        appliedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Index for frequent queries
studentSchema.index({ email: 1, profileVerified: 1 });
studentSchema.index({ branch: 1, cgpa: 1 });
studentSchema.index({ passingYear: 1 });

const Student = User.discriminator('student', studentSchema);

export default Student;
