import mongoose from 'mongoose';

// AUDIT LOGGING - Immutable record of all system actions
const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        'USER_REGISTERED',
        'USER_LOGGED_IN',
        'PROFILE_UPDATED',
        'PROFILE_VERIFIED',
        'PROFILE_REJECTED',
        'JOB_POSTED',
        'JOB_APPROVED',
        'JOB_REJECTED',
        'JOB_CLOSED',
        'APPLICATION_SUBMITTED',
        'APPLICATION_SHORTLISTED',
        'APPLICATION_INTERVIEW',
        'APPLICATION_SELECTED',
        'APPLICATION_REJECTED',
        'ADMIN_OVERRIDE',
        'COMPANY_VERIFIED',
        'COMPANY_REJECTED',
        'PASSWORD_CHANGED',
        'SELECTION_RESULT_UPLOADED',
      ],
      required: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    performedByRole: {
      type: String,
      enum: ['student', 'company', 'admin'],
    },

    targetUser: mongoose.Schema.Types.ObjectId,
    targetJob: mongoose.Schema.Types.ObjectId,
    targetApplication: mongoose.Schema.Types.ObjectId,
    targetCompany: mongoose.Schema.Types.ObjectId,

    // Details of what changed
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },

    remarks: String,
    ipAddress: String,
    userAgent: String,

    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  { timestamps: false }
);

// Index for efficient audit trail retrieval
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ targetUser: 1, timestamp: -1 });

// Make schema immutable to prevent modifications
auditLogSchema.pre('findByIdAndUpdate', function (next) {
  const err = new Error('Audit logs cannot be modified');
  err.statusCode = 403;
  next(err);
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
