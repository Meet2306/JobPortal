const mongoose = require('mongoose');

const companyProfileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyName: { type: String, required: true },
    industry: { type: String },
    websiteUrl: { type: String },
    hrContactName: { type: String },
    hrContactEmail: { type: String },
    hrContactNumber: { type: String },
    description: { type: String },
    isApproved: { type: Boolean, default: false } // Admin approval
}, { timestamps: true });

module.exports = mongoose.model('CompanyProfile', companyProfileSchema);
