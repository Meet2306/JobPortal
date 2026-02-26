import Student from '../models/Student.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import AuditLog from '../models/AuditLog.js';
import EligibilityRuleEngine from '../services/eligibilityService.js';
import { sendEmail } from '../services/emailService.js';

/**
 * Get Student Profile
 */
export const getProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message,
    });
  }
};

/**
 * Update Student Profile
 */
export const updateProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Prevent editing academic details if verified
    if (student.profileVerified) {
      const academicFields = ['cgpa', 'branch', 'backlogs', 'semester', 'passingYear'];
      const attemptedUpdate = academicFields.some((field) => req.body[field] !== undefined);

      if (attemptedUpdate) {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify academic details after profile verification',
        });
      }
    }

    // Allowed fields to update
    const allowedFields = [
      'name',
      'phoneNumber',
      'dateOfBirth',
      'gender',
      'address',
      'city',
      'state',
      'pincode',
      'branch',
      'semester',
      'cgpa',
      'backlogs',
      'passingYear',
      'collegeRollNumber',
      'admissionNumber',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        student[field] = req.body[field];
      }
    });

    // Mark profile as completed if all required fields are filled
    const requiredFields = ['branch', 'semester', 'cgpa', 'passingYear'];
    student.profileCompleted = requiredFields.every((field) => student[field] !== undefined);

    const updatedStudent = await student.save();

    // Audit log
    await AuditLog.create({
      action: 'PROFILE_UPDATED',
      performedBy: req.userId,
      performedByRole: 'student',
      targetUser: req.userId,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      student: updatedStudent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message,
    });
  }
};

/**
 * Upload Resume
 */
export const uploadResume = async (req, res) => {
  try {
    const student = await Student.findById(req.userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // For now, assume resume path is sent in body
    const { resumePath, resumeFileName } = req.body;

    if (!resumePath || !resumeFileName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide resume path and file name',
      });
    }

    // Validate file type (PDF/DOC only)
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const isValidFile = validExtensions.some((ext) => resumeFileName.toLowerCase().endsWith(ext));

    if (!isValidFile) {
      return res.status(400).json({
        success: false,
        message: 'Only PDF and DOC files are allowed',
      });
    }

    student.resumePath = resumePath;
    student.resumeFileName = resumeFileName;
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading resume',
      error: error.message,
    });
  }
};

/**
 * Get Eligible Jobs
 */
export const getEligibleJobs = async (req, res) => {
  try {
    const student = await Student.findById(req.userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Get all active jobs
    const jobs = await Job.find({ status: 'Live', isActive: true }).populate('companyId', 'companyName');

    // Check eligibility for each job
    const eligibleJobs = [];
    const ineligibleJobs = [];

    for (const job of jobs) {
      const eligibility = EligibilityRuleEngine.evaluateEligibility(student, job);
      if (eligibility.isEligible) {
        eligibleJobs.push(job);
      } else {
        ineligibleJobs.push({
          job,
          reasons: eligibility.reasons,
        });
      }
    }

    res.status(200).json({
      success: true,
      eligibleJobs,
      ineligibleJobs,
      stats: {
        totalJobs: jobs.length,
        eligibleCount: eligibleJobs.length,
        ineligibleCount: ineligibleJobs.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching eligible jobs',
      error: error.message,
    });
  }
};

/**
 * Apply for Job
 */
export const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide job ID',
      });
    }

    const student = await Student.findById(req.userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Check if profile is verified
    if (!student.profileVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your profile must be verified before applying',
      });
    }

    // Check if student can apply
    if (!student.canApply) {
      return res.status(403).json({
        success: false,
        message: 'You are not eligible to apply. Contact TPO.',
      });
    }

    // Get job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check job is live
    if (job.status !== 'Live') {
      return res.status(400).json({
        success: false,
        message: 'This job is not currently open for applications',
      });
    }

    // Check eligibility
    const eligibility = EligibilityRuleEngine.evaluateEligibility(student, job);
    if (!eligibility.isEligible) {
      return res.status(403).json({
        success: false,
        message: 'You do not meet the eligibility criteria',
        reasons: eligibility.reasons,
      });
    }

    // Check for duplicate application
    const existingApplication = await Application.findOne({
      studentId: req.userId,
      jobId,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job',
      });
    }

    // Create application
    const application = await Application.create({
      studentId: req.userId,
      jobId,
      companyId: job.companyId,
      status: 'Applied',
      appliedAt: new Date(),
      eligibilityCheckResult: {
        isEligible: true,
        checkedAt: new Date(),
      },
    });

    // Add to student's applied jobs
    student.appliedJobs.push({
      jobId,
      appliedAt: new Date(),
    });
    await student.save();

    // Update job application count
    job.applicationsCount = (job.applicationsCount || 0) + 1;
    await job.save();

    // Send confirmation email
    const company = await require('../models/Company.js').default.findById(job.companyId);
    await sendEmail(
      student.email,
      'applicationSubmitted',
      student.name,
      job.jobTitle,
      company.companyName
    );

    // Audit log
    await AuditLog.create({
      action: 'APPLICATION_SUBMITTED',
      performedBy: req.userId,
      performedByRole: 'student',
      targetApplication: application._id,
      targetJob: jobId,
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error applying for job',
      error: error.message,
    });
  }
};

/**
 * Get Application Status
 */
export const getApplicationStatus = async (req, res) => {
  try {
    const student = await Student.findById(req.userId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const applications = await Application.find({ studentId: req.userId })
      .populate('jobId', 'jobTitle salary')
      .populate('companyId', 'companyName');

    res.status(200).json({
      success: true,
      applications,
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
      message: 'Error fetching applications',
      error: error.message,
    });
  }
};

export default {
  getProfile,
  updateProfile,
  uploadResume,
  getEligibleJobs,
  applyForJob,
  getApplicationStatus,
};
