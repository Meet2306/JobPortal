const StudentProfile = require('../models/StudentProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { sendEmail } = require('../utils/emailService');

exports.getProfile = async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id }).populate('user', 'email');
        if (profile && !profile.emailAddress && profile.user) {
            profile.emailAddress = profile.user.email;
        }
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id });
        const { 
            name, contactNumber, profilePhoto, gender, dateOfBirth, 
            address, linkedinUrl, education, skills,
            activeBacklogs, resumeUrl 
        } = req.body;

        // Ensure email is not editable
        // const { emailAddress, ...otherData } = req.body; 
        
        if (profile.isLocked && profile.editRequestStatus !== 'Approved') {
            return res.status(403).json({ error: 'Profile is locked. Please request edit permission from Admin.' });
        }

        // 1. Basic Info
        profile.name = name || profile.name;
        profile.contactNumber = contactNumber || profile.contactNumber;
        profile.profilePhoto = profilePhoto || profile.profilePhoto;
        profile.gender = gender || profile.gender;
        profile.dateOfBirth = dateOfBirth || profile.dateOfBirth;
        // profile.emailAddress = emailAddress || profile.emailAddress; // EXCLUDED
        profile.address = address || profile.address;
        profile.linkedinUrl = linkedinUrl || profile.linkedinUrl;

        // 2. Education
        if (education) {
            profile.education = { ...profile.education, ...education };
            // Sync legacy fields
            profile.cgpa = education.cgpa !== undefined ? education.cgpa : profile.cgpa;
            profile.branch = education.branch || profile.branch;
            profile.passingYear = education.endYear || profile.passingYear;
        }

        // 3. Skills
        if (skills) {
            profile.skills = { ...profile.skills, ...skills };
        }

        // 4. Internal/Misc
        profile.activeBacklogs = activeBacklogs !== undefined ? activeBacklogs : profile.activeBacklogs;
        profile.resumeUrl = resumeUrl || profile.resumeUrl;

        // Reset edit permission after save
        profile.editRequestStatus = 'None';

        await profile.save();
        res.json({ message: 'Profile updated successfully', profile });
    } catch (err) {
        console.error('Update Profile Error:', err);
        res.status(500).json({ error: 'Server error tracking profile update' });
    }
};

const { updateJobStatus } = require('../utils/jobStatusHelper');

exports.getEligibleJobs = async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        // Get all jobs and update statuses
        const allJobs = await Job.find().populate('company', 'companyName industry location').lean();
        
        const freshJobs = await Promise.all(allJobs.map(async (j) => {
            const jobDoc = await Job.findById(j._id);
            const status = await updateJobStatus(jobDoc);
            return { ...j, status };
        }));

        const currentYear = new Date().getFullYear();
        const currentStudentYear = currentYear + 1;
        const studentPassingYear = profile.endYear || profile.passingYear;
        const isCurrentStudent = studentPassingYear === currentStudentYear;

        // Filter based on visibility and status
        const visibleJobs = freshJobs.filter(job => {
            // 1. Visibility Check
            if (job.visibility === 'Current Only' && !isCurrentStudent) {
                return false;
            }

            // 2. Status Check: Requirement says "visible between Start and Close Date" 
            // but also "See status Upcoming/Open/Closed". 
            // We will show Upcoming and Open, and maybe Closed if recently closed.
            return ['Upcoming', 'Open', 'Closed', 'Positions Filled'].includes(job.status);
        });

        res.json(visibleJobs);
    } catch (err) {
        console.error('Get Eligible Jobs Error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.applyForJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.jobId);
        if (!job) return res.status(404).json({ error: 'Job not found' });

        // Refresh and check status
        const status = await updateJobStatus(job);
        
        if (status !== 'Open') {
            let msg = 'Applications are not currently open for this job.';
            if (status === 'Upcoming') msg = 'This job is upcoming. Applications haven\'t started yet.';
            if (status === 'Closed') msg = 'Applications for this job are closed.';
            if (status === 'Positions Filled') msg = 'We have already reached the required number of applications.';
            return res.status(400).json({ error: msg });
        }

        const profile = await StudentProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        // Visibility Check
        const currentYear = new Date().getFullYear();
        const currentStudentYear = currentYear + 1;
        const studentPassingYear = profile.education?.endYear || profile.endYear || profile.passingYear;
        const isCurrentStudent = studentPassingYear === currentStudentYear;

        if (job.visibility === 'Current Only' && !isCurrentStudent) {
            return res.status(403).json({ error: 'This job is reserved for current students graduating in ' + currentStudentYear + ' only.' });
        }

        // Criteria Check
        if (job.criteria) {
            // 1. CGPA Check
            const studentCGPA = profile.education?.cgpa || profile.cgpa || 0;
            if (job.criteria.minCGPA && studentCGPA < job.criteria.minCGPA) {
                return res.status(400).json({ error: `Minimum CGPA required is ${job.criteria.minCGPA}. Your CGPA is ${studentCGPA}.` });
            }

            // 2. Branch Check
            const studentBranch = profile.education?.branch || profile.branch;
            if (job.criteria.eligibleBranches && job.criteria.eligibleBranches.length > 0) {
                const isEligible = job.criteria.eligibleBranches.some(b => 
                    b.toLowerCase().trim() === studentBranch?.toLowerCase().trim()
                );
                if (!isEligible) {
                    return res.status(400).json({ error: `Your branch (${studentBranch}) is not eligible for this job.` });
                }
            }
        }
        
        // Already applied?
        const existing = await Application.findOne({ job: job._id, student: profile._id });
        if (existing) return res.status(400).json({ error: 'You have already applied for this job' });

        // Create Application
        const application = new Application({
            job: job._id,
            student: profile._id,
            status: 'Applied',
            auditLog: [{ status: 'Applied', changedBy: req.user.id, remarks: 'Student applied' }]
        });

        await application.save();
        
        // Update job status again (in case this was the last position)
        await updateJobStatus(job);

        res.json({ message: 'Applied successfully' });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ error: 'Already applied' });
        res.status(500).json({ error: 'Server error applying for job' });
    }
};

exports.getApplications = async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id });
        const apps = await Application.find({ student: profile._id }).populate({
            path: 'job',
            populate: { path: 'company', select: 'companyName industry location' }
        }).lean();
        res.json(apps);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.requestEditPermission = async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id });
        if (profile.editRequestStatus === 'Pending') return res.status(400).json({ error: 'Request already pending' });
        
        profile.editRequestStatus = 'Pending';
        await profile.save();
        res.json({ message: 'Edit request sent to Admin' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send request' });
    }
};

exports.uploadPhoto = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const profile = await StudentProfile.findOne({ user: req.user.id });
        profile.profilePhoto = `http://localhost:5000/uploads/${req.file.filename}`;
        await profile.save();
        res.json({ message: 'Photo uploaded!', url: profile.profilePhoto });
    } catch (err) {
        res.status(500).json({ error: 'Upload failed' });
    }
};

exports.uploadResume = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const profile = await StudentProfile.findOne({ user: req.user.id });
        profile.resumeUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        await profile.save();
        res.json({ message: 'Resume uploaded!', url: profile.resumeUrl });
    } catch (err) {
        res.status(500).json({ error: 'Upload failed' });
    }
};

exports.submitProfileForApproval = async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ user: req.user.id });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        
        // Backend validation removed as per user request. 
        // Relying entirely on frontend dashboard checks.
        
        profile.status = 'Pending';
        profile.editRequestStatus = 'None';
        profile.isProfileComplete = true; // Automatically mark complete since frontend allowed submission
        profile.isLocked = true;
        await profile.save();
        res.json({ message: 'Profile submitted for admin approval successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error submitting profile' });
    }
};
