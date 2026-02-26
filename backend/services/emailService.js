import nodemailer from 'nodemailer';

// Configure Email Transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Email Templates
const emailTemplates = {
  studentRegistration: (name, email, password) => ({
    subject: 'Welcome to Student Placement Portal - Complete Your Profile',
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Your account has been successfully created on the Student Placement Portal.</p>
      <p><strong>Login Credentials:</strong></p>
      <ul>
        <li>Email: ${email}</li>
        <li>Temporary Password: ${password}</li>
      </ul>
      <p>Please log in and update your password immediately.</p>
      <p>Complete your profile to start applying for jobs.</p>
    `,
  }),

  studentProfileVerification: (name) => ({
    subject: 'Profile Verification Approved - You can now apply for jobs',
    html: `
      <h2>Hello ${name},</h2>
      <p>Your profile has been verified by the TPO admin.</p>
      <p><strong>You are now eligible to apply for job postings.</strong></p>
      <p>Visit the portal to view available opportunities.</p>
    `,
  }),

  studentProfileRejection: (name, reason) => ({
    subject: 'Profile Verification Update',
    html: `
      <h2>Hello ${name},</h2>
      <p>Your profile verification was not approved.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please update your profile and resubmit for verification.</p>
    `,
  }),

  jobPosted: (companyName, jobTitle) => ({
    subject: 'Job Posting Approved - Now Live',
    html: `
      <h2>Hello ${companyName},</h2>
      <p>Your job posting for <strong>${jobTitle}</strong> has been approved and is now live.</p>
      <p>Students can now view and apply for this position.</p>
    `,
  }),

  jobApprovalPending: (companyName, jobTitle) => ({
    subject: 'Job Posting Under Review',
    html: `
      <h2>Hello ${companyName},</h2>
      <p>Your job posting for <strong>${jobTitle}</strong> has been submitted for admin approval.</p>
      <p>You will be notified once it is approved.</p>
    `,
  }),

  jobRejection: (companyName, jobTitle, remarks) => ({
    subject: 'Job Posting Rejected',
    html: `
      <h2>Hello ${companyName},</h2>
      <p>Your job posting for <strong>${jobTitle}</strong> was rejected.</p>
      <p><strong>Reason:</strong> ${remarks}</p>
      <p>Please revise and resubmit your job posting.</p>
    `,
  }),

  applicationSubmitted: (studentName, jobTitle, companyName) => ({
    subject: 'Application Submitted Successfully',
    html: `
      <h2>Hello ${studentName},</h2>
      <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been submitted successfully.</p>
      <p>You will be notified of any updates to your application status.</p>
    `,
  }),

  applicationShortlisted: (studentName, jobTitle, companyName) => ({
    subject: 'Congratulations! You are Shortlisted',
    html: `
      <h2>Hello ${studentName},</h2>
      <p>Great news! You have been shortlisted for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
      <p>Stay tuned for further updates about the interview process.</p>
    `,
  }),

  interviewScheduled: (studentName, jobTitle, companyName, scheduledAt, interviewLink) => ({
    subject: 'Interview Scheduled',
    html: `
      <h2>Hello ${studentName},</h2>
      <p>Your interview for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been scheduled.</p>
      <p><strong>Interview Date & Time:</strong> ${scheduledAt}</p>
      ${interviewLink ? `<p><strong>Interview Link:</strong> <a href="${interviewLink}">${interviewLink}</a></p>` : ''}
      <p>Please ensure you are available at the scheduled time.</p>
    `,
  }),

  selectionResult: (studentName, jobTitle, companyName, salary, joiningDate) => ({
    subject: '🎉 Congratulations! You are Selected',
    html: `
      <h2>Hello ${studentName},</h2>
      <p>Congratulations! You have been selected for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
      <p><strong>Offer Details:</strong></p>
      <ul>
        <li>Package: ${salary} LPA</li>
        <li>Joining Date: ${joiningDate}</li>
      </ul>
      <p>Please accept the offer by logging into the portal.</p>
    `,
  }),

  rejectionNotification: (studentName, jobTitle, companyName) => ({
    subject: 'Application Status Update',
    html: `
      <h2>Hello ${studentName},</h2>
      <p>Thank you for applying for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
      <p>Unfortunately, you were not selected for this position.</p>
      <p>We encourage you to apply for other opportunities. Best of luck!</p>
    `,
  }),

  companyRegistration: (companyName, email) => ({
    subject: 'Company Registration Submitted for Approval',
    html: `
      <h2>Hello ${companyName},</h2>
      <p>Thank you for registering on the Student Placement Portal.</p>
      <p>Your company profile is under review by the TPO admin.</p>
      <p>You will be notified once your profile is approved, after which you can start posting job openings.</p>
    `,
  }),

  companyApproval: (companyName) => ({
    subject: 'Company Profile Approved',
    html: `
      <h2>Hello ${companyName},</h2>
      <p>Your company profile has been approved.</p>
      <p>You can now log in and start posting job openings for our students.</p>
    `,
  }),

  companyRejection: (companyName, reason) => ({
    subject: 'Company Registration Status',
    html: `
      <h2>Hello ${companyName},</h2>
      <p>Your company registration could not be approved.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please contact the admin for more details.</p>
    `,
  }),
};

// Send Email Function
export const sendEmail = async (to, templateKey, ...args) => {
  try {
    const template = emailTemplates[templateKey];
    if (!template) {
      throw new Error(`Email template '${templateKey}' not found`);
    }

    const emailContent = template(...args);
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      ...emailContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Email sent to ${to} (${templateKey})`);
    return true;
  } catch (error) {
    console.error(`✗ Email sending failed for ${to}:`, error.message);
    return false;
  }
};

// Send Bulk Email
export const sendBulkEmail = async (emails, templateKey, ...args) => {
  const results = [];
  for (const email of emails) {
    const result = await sendEmail(email, templateKey, ...args);
    results.push({ email, success: result });
  }
  return results;
};

export default sendEmail;
