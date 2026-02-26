# Student Placement Portal - MERN Stack

> A comprehensive role-based placement automation system for educational institutions with eligibility rules, state machine workflows, and real-time analytics.

## 🎯 Key Features

- **Role-Based Access Control** - Student, Company (Recruiter), Admin (TPO)
- **Smart Eligibility Engine** - CGPA, Branch, Backlogs, Passing Year validation
- **Application Workflow** - State machine with Applied → Shortlisted → Interview → Selected/Rejected
- **Email Notifications** - Automated emails for all lifecycle events
- **Placement Analytics** - Real-time dashboards with statistics
- **Audit Logging** - Immutable activity tracking for compliance
- **Secure Authentication** - JWT + Bcrypt password hashing with strict policy

## 📋 Project Structure

```
JobPortal/
├── backend/
│   ├── models/          # MongoDB schemas (User, Student, Company, Job, Application, AuditLog)
│   ├── controllers/     # Business logic (Auth, Student, Company, Job, Admin)
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth, validation, error handling
│   ├── services/        # Eligibility engine, workflow, email service
│   ├── config/          # Database configuration
│   ├── index.js         # Express server entry point
│   ├── package.json     # Dependencies
│   └── .env.example     # Environment variables template
│
├── FrontEnd/
│   ├── src/
│   │   ├── pages/       # Login, Register, Dashboards
│   │   ├── components/  # Reusable UI components
│   │   ├── styles/      # CSS files
│   │   ├── utils/       # API client, helpers
│   │   ├── hooks/       # Custom React hooks
│   │   ├── App.jsx      # Main router component
│   │   └── main.jsx     # React entry point
│   ├── package.json     # Dependencies
│   └── vite.config.js   # Vite build configuration
│
└── DOCUMENTATION.md     # Comprehensive technical documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/student_placement
   JWT_SECRET=your_super_secret_key_change_this
   JWT_EXPIRE=7d
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_SERVICE=gmail
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start Backend Server**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:5000`

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd FrontEnd
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register/student` - Student registration
- `POST /api/auth/register/company` - Company registration
- `POST /api/auth/login` - Login (universal)
- `POST /api/auth/change-password` - Change password

### Student Endpoints
- `GET /api/student/profile` - Get profile
- `PUT /api/student/profile` - Update profile
- `POST /api/student/resume` - Upload resume
- `GET /api/student/eligible-jobs` - View eligible jobs
- `POST /api/student/apply-job` - Apply for job
- `GET /api/student/applications` - Track applications

### Company Endpoints
- `POST /api/company/create-job` - Create job draft
- `POST /api/company/submit-job` - Submit for approval
- `GET /api/company/jobs` - Get own jobs
- `GET /api/company/applicants/:jobId` - View applicants
- `PUT /api/company/update-application-status` - Update application status
- `POST /api/company/schedule-interview` - Schedule interview

### Admin Endpoints
- `GET /api/admin/students/pending` - Pending students
- `POST /api/admin/students/verify` - Verify student
- `GET /api/admin/companies/pending` - Pending companies
- `POST /api/admin/companies/verify` - Verify company
- `GET /api/admin/jobs/pending-approval` - Pending jobs
- `POST /api/admin/jobs/approve` - Approve job
- `GET /api/admin/statistics` - Placement stats
- `GET /api/admin/audit-logs` - View audit logs

## 🔐 Security Features

### Password Policy
```
Minimum: 8 characters
Required: 
- 1 Uppercase letter
- 1 Lowercase letter
- 1 Numeric digit
- 1 Special character (@$!%*?&)
```

### Authentication
- JWT tokens with 7-day expiration
- Bcryptjs hashing (10 salt rounds)
- Role-based access control
- Token sent in Authorization header or HTTP-only cookies

### Server-Side Validation
- All eligibility rules validated server-side (not client)
- Cannot be bypassed by client manipulation
- CGPA, branch, backlogs, passing year enforced
- Duplicate application prevention

### Audit Logging
- Every critical action logged immutably
- Cannot be modified after creation
- Tracks who, what, when, where for all operations

## 📊 Database Schema

### Collections
1. **User** - Base user (discriminator key: role)
2. **Student** - Student profile (extends User)
3. **Company** - Company profile (extends User)
4. **Job** - Job postings with eligibility criteria
5. **Application** - Student job applications with state machine
6. **AuditLog** - Immutable activity log

### Key Relationships
- One Company → Many Jobs
- One Student → Many Applications
- One Job → Many Applications
- One Admin → Many Approvals/Verifications

## 🎯 User Workflows

### Student Journey
1. Register → Verify email → Complete profile
2. Admin verifies profile → Student can apply
3. Browse eligible jobs (based on rules)
4. Apply → Get shortlisted → Interview → Selected/Rejected
5. Accept offer → Placement confirmed

### Company Journey
1. Register → Submit for approval
2. Admin approves → Can post jobs
3. Create job with eligibility criteria
4. Submit for admin approval
5. Job goes live → Receive applications
6. Shortlist → Schedule interviews → Select candidates

### Admin (TPO) Workflow
1. Verify pending student profiles
2. Approve company registrations
3. Review and approve job postings
4. Monitor applications
5. Generate placement statistics
6. Override decisions if needed (with audit logging)

## 🔄 Application State Machine

```
Applied
  ├─→ Shortlisted
  │     ├─→ Interview Scheduled
  │     │     ├─→ Selected (terminal)
  │     │     └─→ Rejected (terminal)
  │     └─→ Rejected (terminal)
  └─→ Rejected (terminal)
```

## 📧 Email Notifications

**8 Email Templates:**
1. Student Registration Confirmation
2. Profile Verification Approval
3. Profile Verification Rejection
4. Job Posting Approval
5. Job Posting Rejection
6. Application Submitted
7. Application Status Updates (Shortlist, Interview, Selection, Rejection)

## 📈 Analytics Dashboard

**Real-time Metrics:**
- Total students & placed students
- Branch-wise placement statistics
- Salary statistics (highest, lowest, average)
- Company-wise hiring breakdown
- Application success ratio

## 🧪 Testing the Application

### Test User Registrations

**Student Registration:**
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

**Company Registration:**
```bash
curl -X POST http://localhost:5000/api/auth/register/company \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HR Manager",
    "email": "hr@company.com",
    "password": "Pass@1234",
    "companyName": "TechCorp",
    "hrName": "John HR",
    "hrEmail": "hr@company.com",
    "hrPhone": "9999999999"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Pass@1234"
  }'
```

## 🛠 Development

### Backend Scripts
```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm test         # Run tests (not yet implemented)
```

### Frontend Scripts
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 📖 Documentation

For detailed technical documentation including:
- Module-wise explanation
- Workflow diagrams
- Validation logic
- Resume-ready description
- Viva explanation points

See [DOCUMENTATION.md](./DOCUMENTATION.md)

## 🎓 Learning Points

This project demonstrates:
- **MERN Stack** - MongoDB, Express, React, Node.js
- **Backend** - RESTful APIs, middleware, authentication, state machines
- **Database** - Schema design, relationships, indexing, discriminators
- **Security** - Password hashing, JWT, role-based access control, server-side validation
- **Frontend** - React hooks, routing, context API, API integration
- **Business Logic** - Eligibility engines, workflow management, audit logging
- **DevOps** - Environment variables, containerization (future), CI/CD (future)

## 📝 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

Created as a comprehensive MERN stack project showcasing enterprise-level software architecture.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests.

## ❓ FAQ

**Q: How do I set up Gmail for email notifications?**
A: 
1. Enable 2-factor authentication on Gmail
2. Generate an App Password
3. Use the App Password in EMAIL_PASS environment variable

**Q: Can I change the eligibility criteria rules?**
A: Yes! Edit the `EligibilityRuleEngine` in `backend/services/eligibilityService.js`

**Q: How do I add a new user role?**
A: Follow the discriminator pattern used for Student/Company in the models.

**Q: Is the audit log truly immutable?**
A: Yes, the MongoDB schema prevents updates to AuditLog documents after creation.

---

**Project Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** February 2026
