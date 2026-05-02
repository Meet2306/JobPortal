const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    // 1. Basic Information
    name: { type: String, required: true },
    profilePhoto: { type: String },
    gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'] },
    dateOfBirth: { type: Date },
    contactNumber: { type: String, required: true },
    emailAddress: { type: String }, // redundant but for easy access
    address: {
        city: { type: String },
        state: { type: String },
        country: { type: String }
    },
    linkedinUrl: { type: String },

    // 2. Education Details
    education: {
        degree: { type: String }, // B.Tech, B.Sc, etc.
        branch: { type: String },
        collegeName: { type: String },
        startYear: { type: Number },
        endYear: { type: Number },
        status: { type: String, enum: ['Pursuing', 'Completed'], default: 'Pursuing' },
        cgpa: { type: Number }, // Current CGPA
        tenthPercentage: { type: Number },
        twelfthPercentage: { type: Number }
    },

    // 3. Skills Section
    skills: {
        technical: [{ type: String }], // Java, Python, etc.
        soft: [{ type: String }], // Communication, etc.
        tools: [{ type: String }] // Git, Docker, etc.
    },

    // Legacy/Internal fields
    cgpa: { type: Number }, // Keep for compatibility with existing queries
    branch: { type: String }, // Keep for compatibility
    passingYear: { type: Number }, // Keep for compatibility
    activeBacklogs: { type: Number, default: 0 },
    resumeUrl: { type: String },
    status: { type: String, enum: ['Draft', 'Pending', 'Approved', 'Rejected'], default: 'Draft' },
    rejectionReason: { type: String },
    isLocked: { type: Boolean, default: false },
    editRequestStatus: { type: String, enum: ['None', 'Pending', 'Approved'], default: 'None' },
    isProfileComplete: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
