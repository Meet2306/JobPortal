const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },

    status: {
        type: String,
        enum: ['Applied', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'],
        default: 'Applied'
    },

    auditLog: [{
        status: { type: String },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        remarks: { type: String }
    }]

}, { timestamps: true });

// Prevent duplicate applications
applicationSchema.index({ job: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
