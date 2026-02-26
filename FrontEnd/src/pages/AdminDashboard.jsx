import { Routes, Route, Link } from 'react-router-dom';
import '../styles/Dashboard.css';

function AdminDashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>TPO Admin Dashboard</h1>
        <div className="user-menu">
          <button className="btn-logout">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="sidebar">
          <nav className="nav-menu">
            <Link to="/admin" className="nav-link">
              📊 Analytics
            </Link>
            <Link to="/admin/students" className="nav-link">
              👨‍🎓 Student Verifications
            </Link>
            <Link to="/admin/companies" className="nav-link">
              🏢 Company Approvals
            </Link>
            <Link to="/admin/jobs" className="nav-link">
              💼 Job Approvals
            </Link>
            <Link to="/admin/applications" className="nav-link">
              📝 Applications
            </Link>
            <Link to="/admin/audit" className="nav-link">
              🔍 Audit Logs
            </Link>
          </nav>
        </div>

        <div className="main-content">
          <Routes>
            <Route path="/" element={<AdminHome />} />
            <Route path="/students" element={<StudentVerifications />} />
            <Route path="/companies" element={<CompanyApprovals />} />
            <Route path="/jobs" element={<JobApprovals />} />
            <Route path="/applications" element={<ApplicationOverview />} />
            <Route path="/audit" element={<AuditLogs />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function AdminHome() {
  return (
    <div className="home-section">
      <h2>Placement Analytics Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Students</h3>
          <p className="stat-number">--</p>
        </div>
        <div className="stat-card">
          <h3>Placed</h3>
          <p className="stat-number">--</p>
        </div>
        <div className="stat-card">
          <h3>Placement Rate</h3>
          <p className="stat-number">--</p>
        </div>
        <div className="stat-card">
          <h3>Avg Package</h3>
          <p className="stat-number">-- LPA</p>
        </div>
      </div>

      <div className="info-cards">
        <div className="card">
          <h3>📋 Pending Tasks</h3>
          <ul>
            <li>-- Student profiles awaiting verification</li>
            <li>-- Companies awaiting approval</li>
            <li>-- Jobs awaiting approval</li>
          </ul>
        </div>
        <div className="card">
          <h3>📊 Quick Actions</h3>
          <ul>
            <li><Link to="/admin/students">Review Student Profiles</Link></li>
            <li><Link to="/admin/companies">Approve Companies</Link></li>
            <li><Link to="/admin/jobs">Review Job Postings</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StudentVerifications() {
  return <div className="section-content"><h2>Student Profile Verifications</h2><p>Verification queue coming soon...</p></div>;
}

function CompanyApprovals() {
  return <div className="section-content"><h2>Company Registration Approvals</h2><p>Approval queue coming soon...</p></div>;
}

function JobApprovals() {
  return <div className="section-content"><h2>Job Posting Approvals</h2><p>Job approval queue coming soon...</p></div>;
}

function ApplicationOverview() {
  return <div className="section-content"><h2>Application Management</h2><p>Application overview coming soon...</p></div>;
}

function AuditLogs() {
  return <div className="section-content"><h2>Audit Logs</h2><p>Audit trail viewer coming soon...</p></div>;
}

export default AdminDashboard;
