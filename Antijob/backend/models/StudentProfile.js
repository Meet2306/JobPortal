const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true },
    contactNumber: { type: String, required: true },
    cgpa: { type: Number, required: true },
    branch: { type: String, required: true },
    passingYear: { type: Number, required: true },
    activeBacklogs: { type: Number, default: 0 },
    resumeUrl: { type: String }, // Store filepath or URL
    isLocked: { type: Boolean, default: false } // Once verified by admin, cannot be changed
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
