const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const CompanyProfile = require('../models/CompanyProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { sendEmail } = require('../utils/emailService');
const { updateJobStatus } = require('../utils/jobStatusHelper');

exports.getPendingApprovals = async (req, res) => {
    try {
        const unverifiedUsers = await User.find({ isVerified: false, role: { $ne: 'admin' } }).lean();
        
        const userIds = unverifiedUsers.map(u => u._id);
        
        const students = await StudentProfile.find({ user: { $in: userIds } }).lean();
        const companies = await CompanyProfile.find({ user: { $in: userIds } }).lean();

        const usersWithDetails = unverifiedUsers.map(user => {
            if (user.role === 'student') {
                user.details = students.find(s => s.user.toString() === user._id.toString()) || null;
            } else if (user.role === 'company') {
                user.details = companies.find(c => c.user.toString() === user._id.toString()) || null;
            }
            return user;
        });

        const pendingJobs = await Job.find({ status: 'Pending Approval' }).populate({
            path: 'company',
            model: 'CompanyProfile'
        });

        const studentEditRequests = await StudentProfile.find({ editRequestStatus: 'Pending' }).lean();
        const companyEditRequests = await CompanyProfile.find({ editRequestStatus: 'Pending' }).lean();

        const editRequests = [
            ...studentEditRequests.map(r => ({ ...r, role: 'student' })),
            ...companyEditRequests.map(r => ({ ...r, role: 'company' }))
        ];

        res.json({ unverifiedUsers: usersWithDetails, pendingJobs, editRequests });
    } catch (err) {
        console.error('Fetch Pending Error:', err);
        res.status(500).json({ error: 'Server error fetching approvals', details: err.message });
    }
};

exports.verifyUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Ensure profile exists before verifying to prevent orphaned verified users
        if (user.role === 'student') {
            const sp = await StudentProfile.findOne({ user: user._id });
            if (!sp) return res.status(400).json({ error: 'Student profile missing. Cannot verify.' });
            
            user.isVerified = true;
            await user.save();
            
            sp.isLocked = true;
            await sp.save();
            await sendEmail(user.email, 'Profile Verified by TPO', 'Your student profile is mathematically locked and verified. You can now apply to algorithmic matched jobs.');
        } else if (user.role === 'company') {
            const cp = await CompanyProfile.findOne({ user: user._id });
            if (!cp) return res.status(400).json({ error: 'Company profile missing. Cannot verify.' });
            
            user.isVerified = true;
            await user.save();
            
            cp.isApproved = true; 
            cp.isLocked = true;
            await cp.save();
            await sendEmail(user.email, 'Company Profile Approved', 'Your company registration is approved by the Training and Placement Officer.');
        } else {
            user.isVerified = true;
            await user.save();
        }

        res.json({ message: 'User explicitly verified', user });
    } catch (err) {
        console.error('Verify User Error:', err);
        res.status(500).json({ error: 'Verification pipeline failed' });
    }
};

exports.rejectUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Clean up profiles
        if (user.role === 'student') await StudentProfile.deleteOne({ user: user._id });
        else if (user.role === 'company') await CompanyProfile.deleteOne({ user: user._id });
        
        await User.findByIdAndDelete(userId);
        await sendEmail(user.email, 'Registration Rejected', 'Your registration on the Placement Portal was rejected by the TPO. Please contact office for details.');

        res.json({ message: 'User registration purged' });
    } catch (err) {
        res.status(500).json({ error: 'Rejection logic failed' });
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
        
        // Trigger immediate date-based status logic if it was approved
        if (status === 'Live') {
            const freshJob = await Job.findById(job._id);
            await updateJobStatus(freshJob);
        }

        const cUserEmail = job.company.user.email;
        await sendEmail(cUserEmail, `Job Post Update: ${status}`, `Your job opening "${job.title}" is now ${status}. TPO Remarks: ${job.remarks || 'None'}`);

        res.json({ message: 'Job status mutated', job });
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

exports.handleEditRequest = async (req, res) => {
    try {
        const { profileId } = req.params;
        const { action, role } = req.body; // 'approve' or 'reject', role: 'student' or 'company'
        
        const Model = role === 'student' ? StudentProfile : CompanyProfile;
        const profile = await Model.findById(profileId);
        
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        if (action === 'approve') {
            profile.editRequestStatus = 'Approved';
            profile.isLocked = false; // Important: Unlock for editing
        } else {
            profile.editRequestStatus = 'None';
        }
        await profile.save();
        res.json({ message: `Edit request ${action}ed` });
    } catch (err) {
        res.status(500).json({ error: 'Action failed' });
    }
};
