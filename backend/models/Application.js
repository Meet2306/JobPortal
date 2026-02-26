import mongoose from 'mongoose';

// APPLICATION WORKFLOW STATE MACHINE
// Applied → Shortlisted → Interview Scheduled → Selected / Rejected
// Applied → Rejected (can happen at any stage)

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },

    // Application Status - Strict State Machine
    status: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'],
      default: 'Applied',
    },

    // Status Transition History
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: mongoose.Schema.Types.ObjectId,
        remarks: String,
      },
    ],

    // Interview Details
    interviewScheduledAt: Date,
    interviewLink: String,
    interviewType: {
      type: String,
      enum: ['Online', 'Offline', 'Phone'],
    },

    // Selection Details
    selectedAt: Date,
    salary: Number,
    joiningDate: Date,

    // Rejection Details
    rejectedAt: Date,
    rejectionReason: String,

    // Application Metadata
    appliedAt: { type: Date, default: Date.now },
    resumeSnapshot: String, // Store which resume version was used
    eligibilityCheckResult: {
      isEligible: Boolean,
      reasons: [String], // If not eligible, reasons why
      checkedAt: Date,
    },

    // Admin Override Tracking
    adminOverride: {
      overriddenBy: mongoose.Schema.Types.ObjectId,
      overriddenAt: Date,
      reason: String,
      originalStatus: String,
    },
  },
  { timestamps: true }
);

// Ensure unique application per job per student
applicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ studentId: 1, status: 1 });
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ companyId: 1, status: 1 });

const Application = mongoose.model('Application', applicationSchema);

export default Application;
