import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: [true, 'Please provide job title'],
      trim: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    location: String,
    jobType: {
      type: String,
      enum: ['Full-time', 'Internship', 'Contract'],
      required: true,
    },
    salary: {
      type: Number,
      required: true, // in LPA
    },
    maxSalary: Number,

    // Eligibility Criteria
    eligibilityCriteria: {
      minimumCgpa: {
        type: Number,
        default: 0,
      },
      allowedBranches: {
        type: [String],
        enum: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'OTHER', 'All'],
        default: ['All'],
      },
      maxBacklogs: {
        type: Number,
        default: 0,
      },
      allowedPassingYears: {
        type: [Number],
      },
      specializations: [String],
    },

    // Job Status Management
    status: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Approved', 'Live', 'Closed'],
      default: 'Draft',
    },
    postedAt: Date,
    closingDate: Date,
    approvedAt: Date,
    approvedBy: mongoose.Schema.Types.ObjectId,
    approvalRemarks: String,
    rejectionRemarks: String,

    // Application Tracking
    applicationsCount: {
      type: Number,
      default: 0,
    },
    selectedCount: {
      type: Number,
      default: 0,
    },

    // Job Details
    experience: {
      type: Number,
      default: 0, // in years
    },
    skills: [String],
    numberOfPositions: {
      type: Number,
      default: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

jobSchema.index({ companyId: 1, status: 1 });
jobSchema.index({ status: 1, closingDate: 1 });
jobSchema.index({ 'eligibilityCriteria.allowedBranches': 1 });

const Job = mongoose.model('Job', jobSchema);

export default Job;
