const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyProfile', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    requiredSkills: [{ type: String }],
    requiredStudents: { type: Number, required: true, default: 1 },
    location: { type: String, required: true },
    salary: { type: String }, // display text
    package: { type: Number, default: 0 }, // numeric for analytics
    
    criteria: {
        minCGPA: { type: Number, default: 0 },
        eligibleBranches: [{ type: String }]
    },
    
    appStartDate: { type: Date },
    appCloseDate: { type: Date },

    status: {
        type: String,
        enum: ['Pending Approval', 'Upcoming', 'Open', 'Closed', 'Positions Filled', 'Rejected', 'Live'],
        default: 'Pending Approval'
    },
    visibility: {
        type: String,
        enum: ['All', 'Current Only'],
        default: 'All'
    }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
