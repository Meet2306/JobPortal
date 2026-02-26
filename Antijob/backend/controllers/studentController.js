const StudentProfile = require('../models/StudentProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { sendEmail } = require('../utils/emailService');

exports.getProfile = async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id });
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id });
        if (profile.isLocked) {
            return res.status(403).json({ error: 'Profile is locked by Admin. Cannot update academic details.' });
        }

        const { name, contactNumber, cgpa, branch, passingYear, activeBacklogs, resumeUrl } = req.body;
        profile.name = name || profile.name;
        profile.contactNumber = contactNumber || profile.contactNumber;
        profile.cgpa = cgpa !== undefined ? cgpa : profile.cgpa;
        profile.branch = branch || profile.branch;
        profile.passingYear = passingYear || profile.passingYear;
        profile.activeBacklogs = activeBacklogs !== undefined ? activeBacklogs : profile.activeBacklogs;
        profile.resumeUrl = resumeUrl || profile.resumeUrl;

        await profile.save();
        res.json({ message: 'Profile updated successfully', profile });
    } catch (err) {
        res.status(500).json({ error: 'Server error tracking profile update' });
    }
};

exports.getEligibleJobs = async (req, res) => {
    try {
        if (!req.user.isVerified) {
            return res.status(403).json({ error: 'Wait for Admin verification to view jobs' });
        }

        const profile = await StudentProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        // ELIGIBILITY ENGINE (MongoDB Query + Backend Filter)
        const jobs = await Job.find({ status: 'Live' }).populate('company', 'companyName industry');

        const eligibleJobs = jobs.filter(job => {
            const c = job.criteria;
            if (profile.cgpa < c.minCGPA) return false;
            if (profile.activeBacklogs > c.maxBacklogs) return false;
            if (profile.passingYear !== c.passingYear) return false;
            if (c.allowedBranches && c.allowedBranches.length > 0 && !c.allowedBranches.includes(profile.branch)) return false;
            return true;
        });

        res.json(eligibleJobs);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.applyForJob = async (req, res) => {
    try {
        if (!req.user.isVerified) return res.status(403).json({ error: 'Wait for Admin Verification' });

        const job = await Job.findById(req.params.jobId).populate('company');
        if (!job || job.status !== 'Live') return res.status(404).json({ error: 'Job not found or not live' });

        const profile = await StudentProfile.findOne({ user: req.user.id }).populate('user');

        // Validation again at API level
        const c = job.criteria;
        if (profile.cgpa < c.minCGPA ||
            profile.activeBacklogs > c.maxBacklogs ||
            profile.passingYear !== c.passingYear ||
            (c.allowedBranches.length > 0 && !c.allowedBranches.includes(profile.branch))) {
            return res.status(403).json({ error: 'Eligibility requirements not met' });
        }

        // Checking if already applied via unique indexing catch block or explicitly
        const existing = await Application.findOne({ job: job._id, student: profile._id });
        if (existing) return res.status(400).json({ error: 'Already applied for this job' });

        // Create Application
        const application = new Application({
            job: job._id,
            student: profile._id,
            status: 'Applied',
            auditLog: [{ status: 'Applied', changedBy: req.user.id, remarks: 'Student applied' }]
        });

        await application.save();

        res.json({ message: 'Applied successfully' });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ error: 'Already applied' });
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getApplications = async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id });
        const apps = await Application.find({ student: profile._id }).populate({
            path: 'job',
            populate: { path: 'company', select: 'companyName' }
        });
        res.json(apps);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
