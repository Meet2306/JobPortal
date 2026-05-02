const mongoose = require('mongoose');

const companyProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyName: { type: String, required: true },
    industry: { type: String },
    websiteUrl: { type: String },
    hrContactName: { type: String },
    hrContactEmail: { type: String },
    hrContactNumber: { type: String },
    phoneNumber: { type: String },
    address: { type: String },
    description: { type: String },
    gstNumber: { type: String },
    isRegistered: { type: Boolean, default: false },
    registrationDocument: { type: String },
    companyLogo: { type: String },
    status: { type: String, enum: ['Draft', 'Pending', 'Approved', 'Rejected'], default: 'Draft' },
    rejectionReason: { type: String },
    isLocked: { type: Boolean, default: false },
    editRequestStatus: { type: String, enum: ['None', 'Pending', 'Approved'], default: 'None' },
    isProfileComplete: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('CompanyProfile', companyProfileSchema);
