const CompanyProfile = require('../models/CompanyProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { sendEmail } = require('../utils/emailService');
const { updateJobStatus } = require('../utils/jobStatusHelper');

exports.getProfile = async (req, res) => {
    try {
        const profile = await CompanyProfile.findOne({ user: req.user.id }).populate('user', 'email');
        const profileObj = profile.toObject();
        if (profile.user) {
            profileObj.loginEmail = profile.user.email;
        }
        res.json(profileObj);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const profile = await CompanyProfile.findOne({ user: req.user.id });
        if (profile.isLocked) return res.status(403).json({ error: 'Profile is locked. Request edit permission first.' });
        
        Object.assign(profile, req.body);
        
        // Calculate isProfileComplete
        let isComplete = true;
        if (!profile.companyName || !profile.phoneNumber || !profile.address || 
            !profile.industry || !profile.description || !profile.websiteUrl) {
            isComplete = false;
        }
        if (profile.isRegistered && (!profile.registrationDocument || !profile.companyLogo)) {
            isComplete = false;
        }
        profile.isProfileComplete = isComplete;
        profile.editRequestStatus = 'None';
        
        await profile.save();
        res.json({ message: 'Profile updated successfully.', profile });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.requestEdit = async (req, res) => {
    try {
        const profile = await CompanyProfile.findOne({ user: req.user.id });
        if (!profile.isLocked) return res.status(400).json({ error: 'Profile is already unlocked' });
        
        profile.editRequestStatus = 'Pending';
        await profile.save();
        res.json({ message: 'Edit request sent to admin', profile });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Post a new job
exports.postJob = async (req, res) => {
    try {
        const company = await CompanyProfile.findOne({ user: req.user.id });
        if (!company) return res.status(404).json({ error: 'Company profile not found. Please complete setup.' });
        
        // Removed hard blocks for demo if requested to just post, 
        // but keeping current logic if it's there. 
        // requirements: "Company Name (auto from company account)"
        
        const { 
            title, description, requiredSkills, requiredStudents, 
            location, package: pkg, appStartDate, appCloseDate,
            minCGPA, eligibleBranches
        } = req.body;

        const newJob = new Job({ 
            company: company._id,
            title, 
            description, 
            requiredSkills, 
            requiredStudents, 
            location, 
            package: pkg,
            salary: `${pkg} LPA`, // Auto-populate legacy field
            criteria: {
                minCGPA: minCGPA || 0,
                eligibleBranches: eligibleBranches || []
            },
            appStartDate, 
            appCloseDate,
            status: 'Pending Approval'
        });

        await newJob.save();
        console.log(`Job created: ${newJob._id} for company ${company.companyName}`);

        res.status(201).json({ message: 'Job posted successfully. Awaiting Admin approval.', newJob });
    } catch (err) {
        console.error('Post Job Error:', err);
        res.status(500).json({ error: 'Server error posting job' });
    }
};

// Get company jobs with stats
exports.getJobs = async (req, res) => {
    try {
        console.log(`Getting jobs for user: ${req.user.email} (Role: ${req.user.role})`);
        const company = await CompanyProfile.findOne({ user: req.user.id });
        if (!company) return res.status(404).json({ error: 'Company profile not found.' });
        
        const jobs = await Job.find({ company: company._id }).lean();
        
        const jobsWithApps = await Promise.all(jobs.map(async (j) => {
            let actualStatus = j.status;
            try {
                const freshJob = await Job.findById(j._id);
                if (freshJob) {
                    actualStatus = await updateJobStatus(freshJob);
                }
            } catch (statusErr) {
                console.error(`Status sync failed for job ${j._id}:`, statusErr.message);
            }

            const count = await Application.countDocuments({ job: j._id });
            return { ...j, status: actualStatus, applicationCount: count };
        }));

        console.log(`Returning ${jobsWithApps.length} jobs for company ${company.companyName}`);
        res.json(jobsWithApps);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching jobs' });
    }
};

// Get applicants for a specific job
exports.getApplicants = async (req, res) => {
    try {
        const company = await CompanyProfile.findOne({ user: req.user.id });
        const job = await Job.findOne({ _id: req.params.jobId, company: company._id });
        if (!job) return res.status(404).json({ error: 'Job not found' });

        const applications = await Application.find({ job: job._id })
            .populate({
                path: 'student',
                select: 'name emailAddress contactNumber resumeUrl skills education'
            })
            .lean();

        res.json(applications);
    } catch (err) {
        console.error('Get Applicants Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get all applicants for all jobs of the company
exports.getAllApplicants = async (req, res) => {
    try {
        const company = await CompanyProfile.findOne({ user: req.user.id });
        if (!company) return res.status(404).json({ error: 'Company profile not found' });

        const jobs = await Job.find({ company: company._id }).select('_id title');
        const jobIds = jobs.map(j => j._id);

        const applications = await Application.find({ job: { $in: jobIds } })
            .populate({
                path: 'student',
                select: 'name emailAddress contactNumber resumeUrl skills education user'
            })
            .populate({
                path: 'job',
                select: 'title'
            })
            .sort({ createdAt: -1 })
            .lean();

        res.json(applications);
    } catch (err) {
        console.error('Get All Applicants Error:', err);
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

        if (application.status === 'Selected' || application.status === 'Rejected') {
            return res.status(400).json({ error: 'Terminal state reached, action invalid' });
        }

        if (!allowedTransitions[application.status].includes(status)) {
            return res.status(400).json({ error: `Invalid transition from ${application.status} to ${status}` });
        }

        application.status = status;
        application.auditLog.push({ status, changedBy: req.user.id, remarks });
        await application.save();

        const stdUser = await require('../models/User').findById(application.student.user);
        if (stdUser && stdUser.email) {
            const emailHtml = `
                <h3>Update on your application for ${application.job.title}</h3>
                <p>Your application status has changed to: <strong>${status}</strong></p>
                ${remarks ? `<p>Remarks: ${remarks}</p>` : ''}
            `;
            await sendEmail(stdUser.email, `Application Status Update: ${status}`, emailHtml);
        }

        res.json({ message: 'Status updated', application });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.submitProfileForApproval = async (req, res) => {
    try {
        const profile = await CompanyProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        
        // Backend validation removed as per user request. 
        // Relying entirely on frontend dashboard checks.
        
        profile.status = 'Pending';
        profile.editRequestStatus = 'None';
        profile.isProfileComplete = true;
        profile.isLocked = true;
        await profile.save();
        res.json({ message: 'Profile submitted for admin approval successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error submitting profile' });
    }
};

exports.uploadLogo = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const profile = await CompanyProfile.findOne({ user: req.user.id });
        profile.companyLogo = `http://localhost:5000/uploads/${req.file.filename}`;
        await profile.save();
        res.json({ message: 'Logo uploaded!', url: profile.companyLogo });
    } catch (err) {
        res.status(500).json({ error: 'Upload failed' });
    }
};

exports.uploadRegistrationDocument = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const profile = await CompanyProfile.findOne({ user: req.user.id });
        profile.registrationDocument = `http://localhost:5000/uploads/${req.file.filename}`;
        await profile.save();
        res.json({ message: 'Registration document uploaded!', url: profile.registrationDocument });
    } catch (err) {
        res.status(500).json({ error: 'Upload failed' });
    }
};
