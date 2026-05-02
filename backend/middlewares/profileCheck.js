const StudentProfile = require('../models/StudentProfile');
const CompanyProfile = require('../models/CompanyProfile');

const requireApprovedProfile = async (req, res, next) => {
    try {
        let profile = null;
        if (req.user.role === 'student') {
            profile = await StudentProfile.findOne({ user: req.user.id });
        } else if (req.user.role === 'company') {
            profile = await CompanyProfile.findOne({ user: req.user.id });
        }

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found. Please complete your profile.' });
        }

        if (profile.status === 'Pending') {
            return res.status(403).json({ error: 'Waiting for admin approval.' });
        }

        if (profile.status === 'Rejected') {
            return res.status(403).json({ error: `Profile rejected. Reason: ${profile.rejectionReason || 'No reason provided'}. Please update your profile and resubmit.` });
        }

        if (profile.status !== 'Approved') {
            return res.status(403).json({ error: 'Please complete your profile and submit it for admin approval before continuing.' });
        }

        next();
    } catch (err) {
        console.error('Profile Check Error:', err);
        res.status(500).json({ error: 'Server error checking profile status' });
    }
};

module.exports = { requireApprovedProfile };
