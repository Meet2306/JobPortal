const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const CompanyProfile = require('../models/CompanyProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { sendEmail } = require('../utils/emailService');

exports.getPendingApprovals = async (req, res) => {
    try {
        const unverifiedUsers = await User.find({ isVerified: false, role: { $ne: 'admin' } });
        const pendingJobs = await Job.find({ status: 'Pending Approval' }).populate('company');
        res.json({ unverifiedUsers, pendingJobs });
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching approvals' });
    }
};

exports.verifyUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.isVerified = true;
        await user.save();

        if (user.role === 'student') {
            const sp = await StudentProfile.findOne({ user: user._id });
            if (sp) { sp.isLocked = true; await sp.save(); }
            await sendEmail(user.email, 'Profile Verified by TPO', 'Your student profile is mathematically locked and verified. You can now apply to algorithmic matched jobs.');
        } else if (user.role === 'company') {
            const cp = await CompanyProfile.findOne({ user: user._id });
            if (cp) { cp.isApproved = true; await cp.save(); }
            await sendEmail(user.email, 'Company Profile Approved', 'Your company registration is approved by the Training and Placement Officer.');
        }

        res.json({ message: 'User explicitly verified', user });
    } catch (err) {
        res.status(500).json({ error: 'Server err' });
    }
};

exports.approveJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { status, remarks } = req.body; // 'Approved' -> 'Live', 'Rejected'

        const job = await Job.findById(jobId).populate({ path: 'company', populate: { path: 'user', select: 'email' } });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        job.status = status;
        job.remarks = remarks || '';
        await job.save();

        const cUserEmail = job.company.user.email;
        await sendEmail(cUserEmail, `Job Post Update: ${status}`, `Your job opening "${job.title}" is now ${status}. TPO Remarks: ${job.remarks || 'None'}`);

        res.json({ message: 'Job status mutated immutably', job });
    } catch (err) {
        res.status(500).json({ error: 'Server err' });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        const totalSelected = await Application.countDocuments({ status: 'Selected' });
        const companyHiringData = await Application.aggregate([
            { $match: { status: 'Selected' } },
            { $lookup: { from: 'jobs', localField: 'job', foreignField: '_id', as: 'jobDetails' } },
            { $unwind: '$jobDetails' },
            { $lookup: { from: 'companyprofiles', localField: 'jobDetails.company', foreignField: '_id', as: 'companyDetails' } },
            { $unwind: '$companyDetails' },
            { $group: { _id: '$companyDetails.companyName', count: { $sum: 1 } } }
        ]);

        const packageStats = await Job.aggregate([
            { $match: { status: 'Live' } },
            { $group: { _id: null, highest: { $max: '$package' }, lowest: { $min: '$package' }, avg: { $avg: '$package' } } }
        ]);

        res.json({
            totalSelected,
            companyHiringData,
            packageStats: packageStats.length > 0 ? packageStats[0] : { highest: 0, lowest: 0, avg: 0 }
        });
    } catch (err) {
        res.status(500).json({ error: 'Analytics engine failure', details: err.message });
    }
};
