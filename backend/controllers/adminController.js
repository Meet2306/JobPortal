import User from '../models/User.js';
import Student from '../models/Student.js';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import AuditLog from '../models/AuditLog.js';
import ApplicationWorkflowEngine from '../services/workflowService.js';
import { sendEmail } from '../services/emailService.js';

/**
 * Get All Students (Pending Verification)
 */
export const getPendingStudents = async (req, res) => {
  try {
    const students = await Student.find({ profileVerified: false }).sort('-createdAt');

    res.status(200).json({
      success: true,
      students,
      count: students.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message,
    });
  }
};

/**
 * Get All Verified Students
 */
export const getVerifiedStudents = async (req, res) => {
  try {
    const students = await Student.find({ profileVerified: true })
      .select('name email branch cgpa placementStatus')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      students,
      count: students.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching verified students',
      error: error.message,
    });
  }
};

/**
 * Verify Student Profile
 */
export const verifyStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide student ID',
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Check if profile is complete
    if (!student.profileCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Student profile is incomplete. Cannot verify.',
      });
    }

    // Mark as verified
    student.profileVerified = true;
    student.verifiedBy = req.userId;
    student.verificationDate = new Date();
    student.canApply = true;
    student.isVerified = true;

    await student.save();

    // Send verification email
    await sendEmail(student.email, 'studentProfileVerification', student.name);

    // Audit log
    await AuditLog.create({
      action: 'PROFILE_VERIFIED',
      performedBy: req.userId,
      performedByRole: 'admin',
      targetUser: studentId,
    });

    res.status(200).json({
      success: true,
      message: 'Student profile verified successfully',
      student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying student profile',
      error: error.message,
    });
  }
};

/**
 * Reject Student Profile
 */
export const rejectStudentProfile = async (req, res) => {
  try {
    const { studentId, reason } = req.body;

    if (!studentId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide student ID and reason',
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Send rejection email
    await sendEmail(student.email, 'studentProfileRejection', student.name, reason);

    // Audit log
    await AuditLog.create({
      action: 'PROFILE_REJECTED',
      performedBy: req.userId,
      performedByRole: 'admin',
      targetUser: studentId,
      remarks: reason,
    });

    res.status(200).json({
      success: true,
      message: 'Student notified of rejection',
      student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting student profile',
      error: error.message,
    });
  }
};

/**
 * Get Pending Company Registrations
 */
export const getPendingCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ profileVerified: false }).sort('-createdAt');

    res.status(200).json({
      success: true,
      companies,
      count: companies.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching companies',
      error: error.message,
    });
  }
};

/**
 * Verify Company Registration
 */
export const verifyCompanyRegistration = async (req, res) => {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide company ID',
      });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    company.profileVerified = true;
    company.verifiedBy = req.userId;
    company.verificationDate = new Date();
    company.isVerified = true;
    company.isActive = true;

    await company.save();

    // Send approval email
    await sendEmail(company.hrEmail, 'companyApproval', company.companyName);

    // Audit log
    await AuditLog.create({
      action: 'COMPANY_VERIFIED',
      performedBy: req.userId,
      performedByRole: 'admin',
      targetCompany: companyId,
    });

    res.status(200).json({
      success: true,
      message: 'Company verified successfully',
      company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying company',
      error: error.message,
    });
  }
};

/**
 * Reject Company Registration
 */
export const rejectCompanyRegistration = async (req, res) => {
  try {
    const { companyId, reason } = req.body;

    if (!companyId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide company ID and reason',
      });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    company.rejectionReason = reason;

    // Send rejection email
    await sendEmail(company.hrEmail, 'companyRejection', company.companyName, reason);

    // Audit log
    await AuditLog.create({
      action: 'COMPANY_REJECTED',
      performedBy: req.userId,
      performedByRole: 'admin',
      targetCompany: companyId,
      remarks: reason,
    });

    res.status(200).json({
      success: true,
      message: 'Company notified of rejection',
      company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting company',
      error: error.message,
    });
  }
};

/**
 * Get Pending Job Approvals
 */
export const getPendingJobApprovals = async (req, res) => {
  try {
    const jobs = await Job.find({ status: 'Pending Approval' })
      .populate('companyId', 'companyName')
      .sort('-postedAt');

    res.status(200).json({
      success: true,
      jobs,
      count: jobs.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending jobs',
      error: error.message,
    });
  }
};

/**
 * Approve Job Posting
 */
export const approveJobPosting = async (req, res) => {
  try {
    const { jobId, remarks } = req.body;

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

    if (job.status !== 'Pending Approval') {
      return res.status(400).json({
        success: false,
        message: 'Only pending jobs can be approved',
      });
    }

    job.status = 'Approved';
    job.approvedAt = new Date();
    job.approvedBy = req.userId;
    job.approvalRemarks = remarks;

    await job.save();

    // Send approval email
    const company = await Company.findById(job.companyId);
    await sendEmail(company.hrEmail, 'jobPosted', company.companyName, job.jobTitle);

    // Audit log
    await AuditLog.create({
      action: 'JOB_APPROVED',
      performedBy: req.userId,
      performedByRole: 'admin',
      targetJob: jobId,
      remarks,
    });

    res.status(200).json({
      success: true,
      message: 'Job posting approved successfully',
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving job',
      error: error.message,
    });
  }
};

/**
 * Reject Job Posting
 */
export const rejectJobPosting = async (req, res) => {
  try {
    const { jobId, remarks } = req.body;

    if (!jobId || !remarks) {
      return res.status(400).json({
        success: false,
        message: 'Please provide job ID and remarks',
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    if (job.status !== 'Pending Approval') {
      return res.status(400).json({
        success: false,
        message: 'Only pending jobs can be rejected',
      });
    }

    job.status = 'Draft'; // Return to draft for revision
    job.rejectionRemarks = remarks;

    await job.save();

    // Send rejection email
    const company = await Company.findById(job.companyId);
    await sendEmail(company.hrEmail, 'jobRejection', company.companyName, job.jobTitle, remarks);

    // Audit log
    await AuditLog.create({
      action: 'JOB_REJECTED',
      performedBy: req.userId,
      performedByRole: 'admin',
      targetJob: jobId,
      remarks,
    });

    res.status(200).json({
      success: true,
      message: 'Job posting rejected',
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting job',
      error: error.message,
    });
  }
};

/**
 * Get Placement Statistics
 */
export const getPlacementStatistics = async (req, res) => {
  try {
    // Total statistics
    const totalStudents = await Student.countDocuments();
    const verifiedStudents = await Student.countDocuments({ profileVerified: true });
    const placedStudents = await Student.countDocuments({ placementStatus: 'Placed' });
    const selectedCount = await Student.countDocuments({ placementStatus: 'Offer Received' });

    // Branch-wise statistics
    const branchStats = await Student.aggregate([
      { $match: { profileVerified: true } },
      {
        $group: {
          _id: '$branch',
          total: { $sum: 1 },
          placed: {
            $sum: {
              $cond: [{ $eq: ['$placementStatus', 'Placed'] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Salary statistics
    const placedStudentsData = await Student.find({
      placementStatus: 'Placed',
    });

    const salaryStats = {
      highest: Math.max(...placedStudentsData.map((s) => s.package || 0)),
      lowest: Math.min(...placedStudentsData.map((s) => s.package || 0)),
      average:
        placedStudentsData.length > 0
          ? placedStudentsData.reduce((sum, s) => sum + (s.package || 0), 0) / placedStudentsData.length
          : 0,
    };

    // Company-wise hiring
    const companyStats = await Application.aggregate([
      { $match: { status: 'Selected' } },
      {
        $group: {
          _id: '$companyId',
          hiredCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'company',
        },
      },
      { $unwind: '$company' },
      {
        $project: {
          _id: 0,
          company: '$company.companyName',
          hiredCount: 1,
        },
      },
      { $sort: { hiredCount: -1 } },
    ]);

    // Application success ratio
    const totalApplications = await Application.countDocuments();
    const successfulApplications = await Application.countDocuments({ status: 'Selected' });
    const successRatio = totalApplications > 0 ? (successfulApplications / totalApplications) * 100 : 0;

    res.status(200).json({
      success: true,
      statistics: {
        overallStats: {
          totalStudents,
          verifiedStudents,
          placedStudents,
          selectedStudents: selectedCount,
          placementPercentage:
            verifiedStudents > 0 ? ((placedStudents / verifiedStudents) * 100).toFixed(2) : 0,
        },
        branchWiseStats: branchStats,
        salaryStats: {
          highest: salaryStats.highest,
          lowest: salaryStats.lowest,
          average: salaryStats.average.toFixed(2),
        },
        companyWiseStats: companyStats,
        applicationStats: {
          total: totalApplications,
          successful: successfulApplications,
          successRatio: successRatio.toFixed(2),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating statistics',
      error: error.message,
    });
  }
};

/**
 * Admin Override Application Status
 */
export const adminOverrideApplicationStatus = async (req, res) => {
  try {
    const { applicationId, newStatus, reason } = req.body;

    if (!applicationId || !newStatus || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide application ID, new status, and reason',
      });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const previousStatus = application.status;

    // Use workflow engine to apply override
    ApplicationWorkflowEngine.applyAdminOverride(application, newStatus, req.userId, reason);

    await application.save();

    // Audit log with detailed override information
    await AuditLog.create({
      action: 'ADMIN_OVERRIDE',
      performedBy: req.userId,
      performedByRole: 'admin',
      targetApplication: applicationId,
      changes: {
        before: { status: previousStatus },
        after: { status: newStatus },
      },
      remarks: reason,
    });

    res.status(200).json({
      success: true,
      message: `Application status overridden from ${previousStatus} to ${newStatus}`,
      application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error overriding application status',
      error: error.message,
    });
  }
};

/**
 * Get Audit Logs
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { action, userId, limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (action) query.action = action;
    if (userId) query.performedBy = userId;

    const logs = await AuditLog.find(query)
      .populate('performedBy', 'name email role')
      .sort('-timestamp')
      .limit(parseInt(limit))
      .skip(skip);

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching audit logs',
      error: error.message,
    });
  }
};

export default {
  getPendingStudents,
  getVerifiedStudents,
  verifyStudentProfile,
  rejectStudentProfile,
  getPendingCompanies,
  verifyCompanyRegistration,
  rejectCompanyRegistration,
  getPendingJobApprovals,
  approveJobPosting,
  rejectJobPosting,
  getPlacementStatistics,
  adminOverrideApplicationStatus,
  getAuditLogs,
};
