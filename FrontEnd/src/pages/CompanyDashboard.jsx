import { Routes, Route, Link } from 'react-router-dom';
import '../styles/Dashboard.css';

function CompanyDashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Company Dashboard</h1>
        <div className="user-menu">
          <button className="btn-logout">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="sidebar">
          <nav className="nav-menu">
            <Link to="/company/profile" className="nav-link">
              🏢 Company Profile
            </Link>
            <Link to="/company/jobs" className="nav-link">
              💼 Job Postings
            </Link>
            <Link to="/company/applicants" className="nav-link">
              👥 Applicants
            </Link>
            <Link to="/company/analytics" className="nav-link">
              📊 Analytics
            </Link>
          </nav>
        </div>

        <div className="main-content">
          <Routes>
            <Route path="/" element={<CompanyHome />} />
            <Route path="/profile" element={<CompanyProfile />} />
            <Route path="/jobs" element={<JobPostings />} />
            <Route path="/applicants" element={<Applicants />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function CompanyHome() {
  return (
    <div className="home-section">
      <h2>Welcome to Company Portal</h2>
      <div className="info-cards">
        <div className="card">
          <h3>🏢 Setup Profile</h3>
          <p>Complete your company registration</p>
        </div>
        <div className="card">
          <h3>⏳ Await Approval</h3>
          <p>Admin will verify your company details</p>
        </div>
        <div className="card">
          <h3>💼 Post Jobs</h3>
          <p>Create job postings with eligibility criteria</p>
        </div>
        <div className="card">
          <h3>👥 Manage Applicants</h3>
          <p>Review and shortlist candidates</p>
        </div>
      </div>
    </div>
  );
}

function CompanyProfile() {
  return <div className="section-content"><h2>Company Profile</h2><p>Profile management coming soon...</p></div>;
}

function JobPostings() {
  return <div className="section-content"><h2>Job Postings</h2><p>Job management coming soon...</p></div>;
}

function Applicants() {
  return <div className="section-content"><h2>Applicants</h2><p>Applicant management coming soon...</p></div>;
}

function Analytics() {
  return <div className="section-content"><h2>Analytics</h2><p>Analytics dashboard coming soon...</p></div>;
}

export default CompanyDashboard;
