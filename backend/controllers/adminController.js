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
        const { status, remarks, visibility } = req.body; // 'Approved' -> 'Live', 'Rejected'
        
        console.log(`Approving Job: ${jobId}. Status: ${status}, Visibility: ${visibility}`);

        const job = await Job.findById(jobId).populate({ path: 'company', populate: { path: 'user', select: 'email' } });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        job.status = status;
        if (visibility) job.visibility = visibility;
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

        const packageStats = await Application.aggregate([
            { $match: { status: 'Selected' } },
            { $lookup: { from: 'jobs', localField: 'job', foreignField: '_id', as: 'jobDetails' } },
            { $unwind: '$jobDetails' },
            { $match: { 'jobDetails.package': { $gt: 0 } } },
            { $group: { _id: null, highest: { $max: '$jobDetails.package' }, lowest: { $min: '$jobDetails.package' }, avg: { $avg: '$jobDetails.package' } } }
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

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).lean();
        const studentIds = users.filter(u => u.role === 'student').map(u => u._id);
        const companyIds = users.filter(u => u.role === 'company').map(u => u._id);
        
        const students = await StudentProfile.find({ user: { $in: studentIds } }).lean();
        const companies = await CompanyProfile.find({ user: { $in: companyIds } }).lean();
        
        const enrichedUsers = users.map(u => {
            let profile;
            let profileCompletionStatus = 'Incomplete';
            if (u.role === 'student') {
                profile = students.find(s => s.user.toString() === u._id.toString());
                profileCompletionStatus = profile && profile.education && profile.education.cgpa ? 'Complete' : 'Incomplete';
            } else {
                profile = companies.find(c => c.user.toString() === u._id.toString());
                profileCompletionStatus = profile && profile.companyName ? 'Complete' : 'Incomplete';
            }
            return {
                _id: u._id,
                fullName: profile ? (profile.name || profile.companyName) : 'N/A',
                email: u.email,
                role: u.role,
                profileCompletionStatus: profileCompletionStatus,
                approvalStatus: u.isVerified ? 'Approved' : 'Pending'
            };
        });
        
        res.json({ users: enrichedUsers });
    } catch (err) {
        console.error('Get All Users Error:', err);
        res.status(500).json({ error: 'Server error fetching users' });
    }
};

exports.getAllApplications = async (req, res) => {
    try {
        const applications = await Application.find()
            .populate({ path: 'student', populate: { path: 'user', select: 'email' } })
            .populate({ path: 'job', populate: { path: 'company', select: 'companyName' } })
            .lean();
            
        const enrichedApps = applications.map(app => {
            return {
                _id: app._id,
                studentName: app.student?.name || 'N/A',
                studentEmail: app.student?.user?.email || 'N/A',
                appliedCompanyName: app.job?.company?.companyName || 'N/A',
                jobRole: app.job?.title || 'N/A',
                applicationDate: app.appliedAt || app.createdAt,
                status: app.status
            };
        });
        
        res.json({ applications: enrichedApps });
    } catch (err) {
        console.error('Get All Apps Error:', err);
        res.status(500).json({ error: 'Server error fetching applications' });
    }
};

exports.getAllStudentsTracker = async (req, res) => {
    try {
        // 1. Get all verified students with their profiles
        const verifiedStudentUsers = await User.find({ role: 'student', isVerified: true }).lean();
        const studentUserIds = verifiedStudentUsers.map(u => u._id);

        const studentProfiles = await StudentProfile.find({ user: { $in: studentUserIds } }).lean();

        // 2. For each student profile, get their applications
        const profileIds = studentProfiles.map(p => p._id);

        const applications = await Application.find({ student: { $in: profileIds } })
            .populate({
                path: 'job',
                select: 'title package location status company',
                populate: {
                    path: 'company',
                    select: 'companyName industry'
                }
            })
            .lean();

        // 3. Group applications by student
        const appsByStudent = {};
        applications.forEach(app => {
            const sid = app.student.toString();
            if (!appsByStudent[sid]) appsByStudent[sid] = [];
            appsByStudent[sid].push(app);
        });

        // 4. Build response
        const result = studentProfiles.map(profile => {
            const apps = appsByStudent[profile._id.toString()] || [];
            const selectedApp = apps.find(a => a.status === 'Selected');

            return {
                _id: profile._id,
                name: profile.name,
                email: profile.emailAddress,
                branch: profile.education?.branch || profile.branch || '—',
                degree: profile.education?.degree || '—',
                cgpa: profile.education?.cgpa || profile.cgpa || '—',
                passingYear: profile.education?.endYear || profile.passingYear || '—',
                profilePhoto: profile.profilePhoto || null,
                totalApplications: apps.length,
                isPlaced: !!selectedApp,
                selectedCompany: selectedApp ? {
                    companyName: selectedApp.job?.company?.companyName || '—',
                    jobTitle: selectedApp.job?.title || '—',
                    package: selectedApp.job?.package || 0,
                } : null,
                applications: apps.map(a => ({
                    _id: a._id,
                    status: a.status,
                    appliedAt: a.createdAt,
                    jobTitle: a.job?.title || '—',
                    companyName: a.job?.company?.companyName || '—',
                    package: a.job?.package || 0,
                    location: a.job?.location || '—',
                }))
            };
        });

        res.json(result);
    } catch (err) {
        console.error('Student Tracker Error:', err);
        res.status(500).json({ error: 'Failed to fetch student tracker data', details: err.message });
    }
};