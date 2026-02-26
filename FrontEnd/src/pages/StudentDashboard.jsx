import { Routes, Route, Link } from 'react-router-dom';
import '../styles/Dashboard.css';

function StudentDashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Student Dashboard</h1>
        <div className="user-menu">
          <button className="btn-logout">Logout</button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="sidebar">
          <nav className="nav-menu">
            <Link to="/student/profile" className="nav-link">
              📋 My Profile
            </Link>
            <Link to="/student/jobs" className="nav-link">
              💼 Eligible Jobs
            </Link>
            <Link to="/student/applications" className="nav-link">
              📝 My Applications
            </Link>
            <Link to="/student/offers" className="nav-link">
              🎯 Offers
            </Link>
          </nav>
        </div>

        <div className="main-content">
          <Routes>
            <Route path="/" element={<StudentHome />} />
            <Route path="/profile" element={<StudentProfile />} />
            <Route path="/jobs" element={<EligibleJobs />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/offers" element={<Offers />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function StudentHome() {
  return (
    <div className="home-section">
      <h2>Welcome to Student Portal</h2>
      <div className="info-cards">
        <div className="card">
          <h3>📋 Complete Your Profile</h3>
          <p>Start by completing your academic and personal details</p>
        </div>
        <div className="card">
          <h3>⏳ Wait for Verification</h3>
          <p>Admin will verify your profile</p>
        </div>
        <div className="card">
          <h3>💼 Explore Jobs</h3>
          <p>View eligible job postings</p>
        </div>
        <div className="card">
          <h3>📝 Apply</h3>
          <p>Apply for jobs matching your profile</p>
        </div>
      </div>
    </div>
  );
}

function StudentProfile() {
  return <div className="section-content"><h2>My Profile</h2><p>Profile management coming soon...</p></div>;
}

function EligibleJobs() {
  return <div className="section-content"><h2>Eligible Jobs</h2><p>Job listings coming soon...</p></div>;
}

function Applications() {
  return <div className="section-content"><h2>My Applications</h2><p>Application tracker coming soon...</p></div>;
}

function Offers() {
  return <div className="section-content"><h2>Offers</h2><p>Offer details coming soon...</p></div>;
}

export default StudentDashboard;
