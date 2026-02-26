import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Company from '../models/Company.js';
import Student from '../models/Student.js';
import AuditLog from '../models/AuditLog.js';
import EligibilityRuleEngine from '../services/eligibilityService.js';
import { sendEmail } from '../services/emailService.js';

/**
 * Create Job Posting (Draft)
 */
export const createJobPosting = async (req, res) => {
  try {
    const {
      jobTitle,
      jobDescription,
      location,
      jobType,
      salary,
      maxSalary,
      eligibilityCriteria,
      experience,
      skills,
      numberOfPositions,
    } = req.body;

    // Validation
    if (!jobTitle || !jobDescription || !jobType || !salary) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Validate eligibility criteria
    let validatedCriteria = {};
    if (eligibilityCriteria) {
      try {
        validatedCriteria = EligibilityRuleEngine.validateCriteria(eligibilityCriteria);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid eligibility criteria',
          error: error.message,
        });
      }
    }

    // Create job in Draft status
    const job = await Job.create({
      jobTitle,
      jobDescription,
      companyId: req.userId,
      location,
      jobType,
      salary,
      maxSalary,
      eligibilityCriteria: validatedCriteria,
      experience,
      skills,
      numberOfPositions,
      status: 'Draft',
    });

    res.status(201).json({
      success: true,
      message: 'Job posting created as draft',
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating job posting',
      error: error.message,
    });
  }
};

/**
 * Submit Job for Approval
 */
export const submitJobForApproval = async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide job ID',
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if company owns this job
    if (job.companyId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to submit this job',
      });
    }

    // Only draft jobs can be submitted
    if (job.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: `Only draft jobs can be submitted. Current status: ${job.status}`,
      });
    }

    // Update status to Pending Approval
    job.status = 'Pending Approval';
    job.postedAt = new Date();
    await job.save();

    // Audit log
    await AuditLog.create({
      action: 'JOB_POSTED',
      performedBy: req.userId,
      performedByRole: 'company',
      targetJob: jobId,
    });

    // Send email to company
    const company = await Company.findById(req.userId);
    await sendEmail(company.hrEmail, 'jobApprovalPending', company.companyName, job.jobTitle);

    res.status(200).json({
      success: true,
      message: 'Job posting submitted for admin approval',
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting job for approval',
      error: error.message,
    });
  }
};

/**
 * Get Company's Jobs
 */
export const getCompanyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ companyId: req.userId }).sort('-createdAt');

    res.status(200).json({
      success: true,
      jobs,
      stats: {
        total: jobs.length,
        draft: jobs.filter((j) => j.status === 'Draft').length,
        pending: jobs.filter((j) => j.status === 'Pending Approval').length,
        approved: jobs.filter((j) => j.status === 'Approved').length,
        live: jobs.filter((j) => j.status === 'Live').length,
        closed: jobs.filter((j) => j.status === 'Closed').length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message,
    });
  }
};

/**
 * Get Job Applicants
 */
export const getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if company owns this job
    if (job.companyId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view applicants for this job',
      });
    }

    const applications = await Application.find({ jobId })
      .populate('studentId', 'name email branch cgpa')
      .sort('-appliedAt');

    res.status(200).json({
      success: true,
      applicants: applications,
      stats: {
        total: applications.length,
        applied: applications.filter((a) => a.status === 'Applied').length,
        shortlisted: applications.filter((a) => a.status === 'Shortlisted').length,
        interviewed: applications.filter((a) => a.status === 'Interview Scheduled').length,
        selected: applications.filter((a) => a.status === 'Selected').length,
        rejected: applications.filter((a) => a.status === 'Rejected').length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching applicants',
      error: error.message,
    });
  }
};

/**
 * Shortlist / Reject Applicant
 */
export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId, status, remarks } = req.body;

    if (!applicationId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide application ID and status',
      });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const job = await Job.findById(application.jobId);

    // Check if company owns this job
    if (job.companyId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this application',
      });
    }

    // Valid transitions from company
    const validTransitions = {
      Applied: ['Shortlisted', 'Rejected'],
      Shortlisted: ['Interview Scheduled', 'Rejected'],
    };

    if (!validTransitions[application.status] || !validTransitions[application.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${application.status}' to '${status}'`,
      });
    }

    // Update status
    const previousStatus = application.status;
    application.status = status;

    if (status === 'Rejected') {
      application.rejectedAt = new Date();
      application.rejectionReason = remarks || '';
    }

    application.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.userId,
      remarks,
    });

    await application.save();

    // Send email to student
    const student = await Student.findById(application.studentId);
    const company = await Company.findById(req.userId);

    if (status === 'Shortlisted') {
      await sendEmail(
        student.email,
        'applicationShortlisted',
        student.name,
        job.jobTitle,
        company.companyName
      );
    } else if (status === 'Rejected') {
      await sendEmail(
        student.email,
        'rejectionNotification',
        student.name,
        job.jobTitle,
        company.companyName
      );
    }

    // Audit log
    await AuditLog.create({
      action: status === 'Shortlisted' ? 'APPLICATION_SHORTLISTED' : 'APPLICATION_REJECTED',
      performedBy: req.userId,
      performedByRole: 'company',
      targetApplication: applicationId,
      remarks,
    });

    res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating application status',
      error: error.message,
    });
  }
};

/**
 * Schedule Interview
 */
export const scheduleInterview = async (req, res) => {
  try {
    const { applicationId, interviewDate, interviewLink, interviewType } = req.body;

    if (!applicationId || !interviewDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide application ID and interview date',
      });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const job = await Job.findById(application.jobId);

    // Check if company owns this job
    if (job.companyId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to schedule interview for this application',
      });
    }

    // Can only schedule interview for shortlisted candidates
    if (application.status !== 'Shortlisted') {
      return res.status(400).json({
        success: false,
        message: 'Can only schedule interview for shortlisted candidates',
      });
    }

    application.interviewScheduledAt = interviewDate;
    application.interviewLink = interviewLink;
    application.interviewType = interviewType;
    application.status = 'Interview Scheduled';

    application.statusHistory.push({
      status: 'Interview Scheduled',
      changedAt: new Date(),
      changedBy: req.userId,
      remarks: `Interview scheduled for ${interviewDate}`,
    });

    await application.save();

    // Send email to student
    const student = await Student.findById(application.studentId);
    const company = await Company.findById(req.userId);

    await sendEmail(
      student.email,
      'interviewScheduled',
      student.name,
      job.jobTitle,
      company.companyName,
      interviewDate,
      interviewLink
    );

    // Audit log
    await AuditLog.create({
      action: 'APPLICATION_INTERVIEW',
      performedBy: req.userId,
      performedByRole: 'company',
      targetApplication: applicationId,
      remarks: `Interview scheduled for ${interviewDate}`,
    });

    res.status(200).json({
      success: true,
      message: 'Interview scheduled successfully',
      application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error scheduling interview',
      error: error.message,
    });
  }
};

export default {
  createJobPosting,
  submitJobForApproval,
  getCompanyJobs,
  getJobApplicants,
  updateApplicationStatus,
  scheduleInterview,
};
