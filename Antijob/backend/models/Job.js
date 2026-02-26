const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyProfile', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    package: { type: Number, required: true }, // in LPA for analytics

    criteria: {
        minCGPA: { type: Number, required: true },
        allowedBranches: [{ type: String }],
        passingYear: { type: Number, required: true },
        maxBacklogs: { type: Number, default: 0 }
    },

    status: {
        type: String,
        enum: ['Draft', 'Pending Approval', 'Approved', 'Live', 'Closed'],
        default: 'Draft'
    },
    remarks: { type: String } // TPO can add remarks for rejection/approval
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
