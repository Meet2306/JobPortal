# Student Placement Portal - Technical Quick Reference
## Interview Preparation & Implementation Guide

---

## 🎯 PROJECT AT A GLANCE

**Title:** Student Placement Portal – Role-Based Placement Automation System

**Stack:** MERN (MongoDB, Express, React, Node.js)

**Users:** 3 Roles (Student, Company, Admin)

**Key Features:** Eligibility Engine, State Machine, Email Notifications, Audit Logs

**Code:** 5,000+ lines, 30+ endpoints, 6 DB collections

---

## 🔑 KEY CONCEPTS (To Memorize for Interview)

### 1. ELIGIBILITY RULE ENGINE
```
Rules enforced SERVER-SIDE:
✓ Profile must be verified
✓ Student has canApply flag = true
✓ CGPA >= job.minimumCgpa
✓ Branch in job.allowedBranches
✓ Backlogs <= job.maxBacklogs
✓ Passing year in allowedYears

File: backend/services/eligibilityService.js
Why Server-Side: Cannot be bypassed by client
```

### 2. APPLICATION STATE MACHINE
```
States: Applied → Shortlisted → Interview → Selected/Rejected

Valid Transitions:
✓ Applied → Shortlisted
✓ Applied → Rejected
✓ Shortlisted → Interview Scheduled
✓ Shortlisted → Rejected
✓ Interview Scheduled → Selected
✓ Interview Scheduled → Rejected
✗ Selected → Rejected (terminal)
✗ Applied → Selected (invalid)

File: backend/services/workflowService.js
```

### 3. PASSWORD VALIDATION
```
Regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

Requires:
- Minimum 8 characters
- 1 uppercase letter (A-Z)
- 1 lowercase letter (a-z)
- 1 numeric digit (0-9)
- 1 special character (@$!%*?&)

Hashing: bcryptjs.hash(password, 10 rounds)
```

### 4. JWT AUTHENTICATION
```
Flow:
1. User logs in with email + password
2. Password matched with bcryptjs.compare()
3. JWT created: jwt.sign({ id, role }, SECRET, { expiresIn: '7d' })
4. Token returned to client
5. Client sends token in Authorization header for protected routes
6. Server verifies token: jwt.verify(token, SECRET)
7. If invalid/expired: 401 Unauthorized

Header Format: Authorization: Bearer TOKEN
```

### 5. ROLE-BASED ACCESS CONTROL
```
Middleware:
authorizeRole(['student'])(req, res, next)
- Checks req.userRole from JWT
- If role matches: next()
- Else: 403 Forbidden

Example Routes:
✓ POST /api/student/apply-job - only 'student' role
✓ POST /api/company/create-job - only 'company' role
✓ POST /api/admin/students/verify - only 'admin' role
```

---

## 💾 DATABASE SCHEMA (Quick View)

### User (Base)
```
{
  name, email, password (hashed), role (enum),
  isVerified, isActive, phoneNumber, timestamps
}
```

### Student (Extends User)
```
{
  // Inherited: name, email, password, role
  // Academic: branch, semester, cgpa, backlogs, passingYear
  // Status: profileCompleted, profileVerified, canApply
  // Placement: placementStatus, placedCompany, package
  // Resume: resumePath, resumeFileName
  // Applications: appliedJobs (array)
}
```

### Company (Extends User)
```
{
  // Inherited: name, email, password, role
  // Details: companyName, website, industry, location
  // HR: hrName, hrEmail, hrPhone
  // Status: profileVerified, verifiedBy, verificationDate
  // Stats: jobsPosted, applicationsReceived, studentsHired
}
```

### Job
```
{
  jobTitle, jobDescription, companyId,
  location, jobType, salary, experience,
  status (Draft → Pending → Approved → Live → Closed),
  eligibilityCriteria { minimumCgpa, allowedBranches, maxBacklogs, allowedPassingYears },
  applicationsCount, selectedCount
}
```

### Application
```
{
  studentId, jobId, companyId,
  status (Applied → Shortlisted → Interview → Selected/Rejected),
  statusHistory [ { status, changedAt, changedBy, remarks } ],
  interviewScheduledAt, interviewLink, interviewType,
  selectedAt, salary, joiningDate,
  rejectedAt, rejectionReason,
  eligibilityCheckResult { isEligible, reasons },
  adminOverride { overriddenBy, reason, originalStatus }
}
```

### AuditLog
```
{
  action (enum: 15+ types),
  performedBy (userId), performedByRole,
  targetUser, targetJob, targetApplication,
  changes { before, after },
  remarks, ipAddress, userAgent,
  timestamp (immutable)
}
```

---

## 🔌 API ENDPOINTS (By Role)

### Auth (Public)
```
POST /api/auth/register/student { name, email, password, phoneNumber }
POST /api/auth/register/company { name, email, password, companyName, hrName, hrEmail }
POST /api/auth/login { email, password }
POST /api/auth/change-password { currentPassword, newPassword } [Protected]
```

### Student
```
GET  /api/student/profile
PUT  /api/student/profile { name, cgpa, branch, ... }
POST /api/student/resume { resumePath, resumeFileName }
GET  /api/student/eligible-jobs
POST /api/student/apply-job { jobId }
GET  /api/student/applications
```

### Company
```
POST /api/company/create-job { jobTitle, jobDescription, eligibilityCriteria }
POST /api/company/submit-job { jobId }
GET  /api/company/jobs
GET  /api/company/applicants/:jobId
PUT  /api/company/update-application-status { applicationId, status, remarks }
POST /api/company/schedule-interview { applicationId, interviewDate, interviewLink }
```

### Admin
```
GET  /api/admin/students/pending
POST /api/admin/students/verify { studentId }
POST /api/admin/students/reject { studentId, reason }
GET  /api/admin/companies/pending
POST /api/admin/companies/verify { companyId }
POST /api/admin/companies/reject { companyId, reason }
GET  /api/admin/jobs/pending-approval
POST /api/admin/jobs/approve { jobId, remarks }
POST /api/admin/jobs/reject { jobId, remarks }
POST /api/admin/applications/override-status { applicationId, newStatus, reason }
GET  /api/admin/statistics
GET  /api/admin/audit-logs?action=ACTION&page=1&limit=50
```

---

## 📧 EMAIL TEMPLATES

```
1. studentRegistration(name, email, password)
2. studentProfileVerification(name)
3. studentProfileRejection(name, reason)
4. jobPosted(companyName, jobTitle)
5. jobApprovalPending(companyName, jobTitle)
6. jobRejection(companyName, jobTitle, remarks)
7. applicationSubmitted(studentName, jobTitle, companyName)
8. applicationShortlisted(studentName, jobTitle, companyName)
9. interviewScheduled(studentName, jobTitle, companyName, dateTime, link)
10. selectionResult(studentName, jobTitle, companyName, salary, joiningDate)
11. rejectionNotification(studentName, jobTitle, companyName)
12. companyRegistration(companyName, email)
13. companyApproval(companyName)
14. companyRejection(companyName, reason)
```

---

## 🔒 SECURITY CHECKLIST

- ✓ Passwords hashed with bcryptjs (10 salt rounds)
- ✓ JWT tokens with 7-day expiration
- ✓ Role-based access control on every route
- ✓ Server-side validation (not client-side)
- ✓ Password policy regex enforced
- ✓ CGPA/branch cannot be spoofed
- ✓ Duplicate application prevention
- ✓ Environment variables for secrets (.env file)
- ✓ CORS limited to frontend origin only
- ✓ Audit logs immutable after creation
- ✓ Admin overrides fully logged
- ✓ User authentication events tracked

---

## 📊 ANALYTICS ENDPOINTS

```
GET /api/admin/statistics

Returns:
{
  statistics: {
    overallStats: {
      totalStudents,
      verifiedStudents,
      placedStudents,
      selectedStudents,
      placementPercentage
    },
    branchWiseStats: [
      { branch, total, placed },
      ...
    ],
    salaryStats: {
      highest,
      lowest,
      average
    },
    companyWiseStats: [
      { company, hiredCount },
      ...
    ],
    applicationStats: {
      total,
      successful,
      successRatio
    }
  }
}
```

---

## 🧪 TESTING CURL COMMANDS

### Register Student
```bash
curl -X POST http://localhost:5000/api/auth/register/student \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Pass@1234",
    "phoneNumber": "9999999999"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Pass@1234"
  }'

# Get TOKEN from response
```

### Get Profile (with token)
```bash
curl -X GET http://localhost:5000/api/student/profile \
  -H "Authorization: Bearer TOKEN_HERE"
```

### Apply for Job
```bash
curl -X POST http://localhost:5000/api/student/apply-job \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_HERE" \
  -d '{
    "jobId": "JOBID_HERE"
  }'
```

---

## 🎓 INTERVIEW ANSWERS (Memorize These)

### Q1: Why server-side validation for eligibility?
**A:** Client-side validation can be bypassed by opening dev console or intercepting requests. Server-side rules cannot be bypassed, preventing fraudulent applications.

### Q2: What is a state machine?
**A:** A system with fixed states and allowed transitions. In our app:
- States: Applied, Shortlisted, Interview, Selected, Rejected
- Transitions are pre-defined and enforced
- Cannot skip stages (e.g., Applied → Selected is invalid)
- Rejected is terminal (no further transitions)

### Q3: Why immutable audit logs?
**A:** To ensure accountability and prevent tampering. If admin claims they approved something, we can check the immutable audit log to verify.

### Q4: What is JWT?
**A:** JSON Web Token containing user ID and role, signed with a secret. Stateless (no server-side session), scalable, and matches modern app architecture.

### Q5: What is bcryptjs?
**A:** Algorithm for securely hashing passwords. Uses salt rounds (we use 10) to make rainbow table attacks infeasible.

### Q6: What is discriminator pattern?
**A:** MongoDB/Mongoose feature for inheritance. Base User model with Student and Company as discriminators, reducing schema duplication.

### Q7: How do role-based routes work?
**A:** Middleware checks req.userRole (from JWT) against allowed roles. If match, route executes. Else, 403 Forbidden.

### Q8: What validation is on eligibility criteria?
**A:** CGPA between 0-10, branches from allowed list, non-negative backlogs, realistic passing years.

### Q9: Why is resume file validation needed?
**A:** Only PDF/DOC files allowed. Prevents executable files or other malicious file types.

### Q10: How are duplicate applications prevented?
**A:** Unique index on [studentId, jobId]. Database automatically prevents duplicates.

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Change JWT_SECRET to random 32-char string
- [ ] Update MONGODB_URI to production database
- [ ] Set EMAIL credentials for production SMTP
- [ ] Change NODE_ENV to 'production'
- [ ] Update FRONTEND_URL CORS origin
- [ ] Enable HTTPS
- [ ] Set rate limiting on API
- [ ] Enable database backups
- [ ] Configure monitoring/logging
- [ ] Use environment variables for all secrets
- [ ] Test all critical endpoints
- [ ] Verify email notifications work
- [ ] Check audit logs are being created

---

## 📈 PERFORMANCE OPTIMIZATION

**Indexing Strategy:**
- `{ email: 1 }` - User queries
- `{ role: 1 }` - Role-based filtering
- `{ studentId: 1, jobId: 1 }` - Application uniqueness
- `{ companyId: 1, status: 1 }` - Job queries
- `{ timestamp: -1 }` - Sorted audit logs

**Query Optimization:**
- Pagination for large result sets
- Select specific fields (not whole documents)
- Use `.lean()` for read-only queries
- Index frequently queried fields

**Scaling:**
- Load balancer (Nginx)
- Multiple Node.js instances
- MongoDB replica sets
- Redis cache for frequently accessed data
- S3 for resume storage

---

## 🔍 DEBUGGING TIPS

**JWT Issues:**
- Check token in console
- Verify JWT_SECRET matches
- Check token expiration
- Look for Authorization header

**Email Not Sending:**
- Verify EMAIL credentials
- Check Gmail app password
- Enable 2FA on Gmail
- Check logs for error messages

**Eligibility Issues:**
- Verify student profile is marked verified
- Check if job criteria is correct
- Ensure eligibility check runs server-side
- Look at eligibilityCheckResult in application

**State Machine Errors:**
- Check current application status
- Verify transition is in VALID_TRANSITIONS
- Look at statusHistory array
- Check error message for reason

---

## 📚 FILE LOCATION GUIDE

**Models:** `backend/models/*.js` (6 files)
**Controllers:** `backend/controllers/*.js` (4 files)
**Services:** `backend/services/*.js` (3 files)
**Routes:** `backend/routes/*.js` (4 files)
**Middleware:** `backend/middleware/auth.js`
**Frontend Pages:** `FrontEnd/src/pages/*.jsx` (7 files)
**Frontend Styles:** `FrontEnd/src/styles/*.css` (2 files)
**Docs:** `DOCUMENTATION.md`, `README.md`, `PROJECT_DELIVERY.md`

---

## ⚡ KEY CODE SNIPPETS

### Password Hashing
```javascript
const salt = await bcryptjs.genSalt(10);
this.password = await bcryptjs.hash(this.password, salt);
```

### JWT Creation
```javascript
const token = jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRE || '7d'
});
```

### Role Check Middleware
```javascript
export const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  }
}
```

### Eligibility Check
```javascript
const eligibility = EligibilityRuleEngine.evaluateEligibility(student, job);
if (!eligibility.isEligible) {
  return res.status(403).json({
    success: false,
    message: 'Eligibility criteria not met',
    reasons: eligibility.reasons
  });
}
```

### State Transition
```javascript
const validation = ApplicationWorkflowEngine.validateTransition(
  application.status,
  newStatus
);
if (!validation.allowed) {
  return res.status(400).json({ success: false, message: validation.reason });
}
```

---

## 📋 FINAL CHECKLIST FOR INTERVIEWS

**Know These by Heart:**
- [ ] 6 Eligibility rules
- [ ] 5 Application states
- [ ] 3 User roles & their permissions
- [ ] 30+ API endpoints
- [ ] 8 Email templates
- [ ] Password validation regex
- [ ] JWT flow
- [ ] State machine concept
- [ ] Why server-side validation
- [ ] Database schema structure

**Be Ready to Explain:**
- [ ] How eligibility engine works
- [ ] How state machine prevents invalid transitions
- [ ] How JWT authentication works
- [ ] How role-based access control works
- [ ] Why audit logs are immutable
- [ ] How to scale this application
- [ ] Security implementation  strategy
- [ ] Database indexing strategy
- [ ] Error handling approach
- [ ] Next features to add

---

**💡 Remember:** This is a PRODUCTION-READY application. Each component has a purpose. Be confident explaining the architecture.

---

Generated: February 2026
Last Updated: February 2026
Status: Ready for Interview
