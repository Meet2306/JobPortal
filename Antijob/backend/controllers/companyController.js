const CompanyProfile = require('../models/CompanyProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { sendEmail } = require('../utils/emailService');

exports.getProfile = async (req, res) => {
    try {
        const profile = await CompanyProfile.findOne({ user: req.user.id });
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const profile = await CompanyProfile.findOne({ user: req.user.id });
        Object.assign(profile, req.body);
        await profile.save();
        res.json({ message: 'Profile updated successfully', profile });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Post a new job
exports.postJob = async (req, res) => {
    try {
        const company = await CompanyProfile.findOne({ user: req.user.id });
        if (!company.isApproved) return res.status(403).json({ error: 'Company must be approved by TPO to post jobs.' });

        const newJob = new Job({ ...req.body, company: company._id, status: 'Pending Approval' });
        await newJob.save();

        res.status(201).json({ message: 'Job posted and sent for admin approval.', newJob });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Get company jobs
exports.getJobs = async (req, res) => {
    try {
        const company = await CompanyProfile.findOne({ user: req.user.id });
        const jobs = await Job.find({ company: company._id });
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Get applicants for a specific job
exports.getApplicants = async (req, res) => {
    try {
        const company = await CompanyProfile.findOne({ user: req.user.id });
        const job = await Job.findOne({ _id: req.params.jobId, company: company._id });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        const applications = await Application.find({ job: job._id }).populate({
            path: 'student',
            populate: { path: 'user', select: 'email' }
        });

        res.json(applications);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Update application state
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const allowedTransitions = {
            'Applied': ['Shortlisted', 'Rejected'],
            'Shortlisted': ['Interview Scheduled', 'Rejected'],
            'Interview Scheduled': ['Selected', 'Rejected']
        };

        const application = await Application.findById(req.params.appId).populate('student').populate('job');
        if (!application) return res.status(404).json({ error: 'Application not found' });

        // Validate Transition
        if (application.status === 'Selected' || application.status === 'Rejected') {
            return res.status(400).json({ error: 'Terminal state reached, action invalid' });
        }

        if (!allowedTransitions[application.status].includes(status)) {
            return res.status(400).json({ error: `Invalid transition from ${application.status} to ${status}` });
        }

        application.status = status;
        application.auditLog.push({ status, changedBy: req.user.id, remarks });
        await application.save();

        // Trigger Email to Student using their populated user's email
        // Let's assume student populates up to user to get email, for brevity we get user directly
        const stdUser = await require('../models/User').findById(application.student.user);
        const emailHtml = `
      <h3>Update on your application for ${application.job.title}</h3>
      <p>Your application status has changed to: <strong>${status}</strong></p>
      ${remarks ? `<p>Remarks: ${remarks}</p>` : ''}
    `;
        await sendEmail(stdUser.email, `Application Status Update: ${status}`, emailHtml);

        res.json({ message: 'Status updated and email generated', application });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
