import '../styles/Dashboard.css'

function Dashboard() {
  // Mock data for jobs
  const jobListings = [
    {
      id: 1,
      title: 'Senior React Developer',
      company: 'Tech Solutions Inc.',
      location: 'San Francisco, CA',
      salary: '$120k - $150k',
      type: 'Full-time',
      posted: '2 days ago',
      logo: '🏢'
    },
    {
      id: 2,
      title: 'UI/UX Designer',
      company: 'Creative Studios',
      location: 'New York, NY',
      salary: '$90k - $120k',
      type: 'Full-time',
      posted: '3 days ago',
      logo: '🎨'
    },
    {
      id: 3,
      title: 'Full Stack Developer',
      company: 'StartUp Hub',
      location: 'Remote',
      salary: '$100k - $130k',
      type: 'Remote',
      posted: '1 day ago',
      logo: '💻'
    },
    {
      id: 4,
      title: 'Data Scientist',
      company: 'AI Innovations',
      location: 'Boston, MA',
      salary: '$130k - $160k',
      type: 'Full-time',
      posted: '4 days ago',
      logo: '📊'
    },
    {
      id: 5,
      title: 'Product Manager',
      company: 'Global Tech',
      location: 'Seattle, WA',
      salary: '$110k - $140k',
      type: 'Full-time',
      posted: '5 days ago',
      logo: '🎯'
    },
    {
      id: 6,
      title: 'Cloud Engineer',
      company: 'Cloud Systems',
      location: 'Austin, TX',
      salary: '$115k - $145k',
      type: 'Full-time',
      posted: '1 day ago',
      logo: '☁️'
    }
  ]

  const stats = [
    { value: '2,450+', label: 'Active Jobs', icon: '📌' },
    { value: '5,200+', label: 'Companies', icon: '🏪' },
    { value: '95%', label: 'Success Rate', icon: '✅' },
    { value: '100k+', label: 'Users', icon: '👥' }
  ]

  const categories = [
    { name: 'Technology', count: '450+', icon: '💻' },
    { name: 'Design', count: '280+', icon: '🎨' },
    { name: 'Marketing', count: '320+', icon: '📢' },
    { name: 'Sales', count: '210+', icon: '💼' },
    { name: 'Finance', count: '180+', icon: '💰' },
    { name: 'Healthcare', count: '150+', icon: '⚕️' }
  ]

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-container">
          <div className="logo-section">
            <h1 className="logo">JobPortal</h1>
          </div>
          <div className="nav-links">
            <a href="#" className="nav-link">Browse Jobs</a>
            <a href="#" className="nav-link">For Companies</a>
            <a href="#" className="nav-link">About</a>
            <button className="btn-primary">Sign In</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h2 className="hero-title">Find Your Dream Job Today</h2>
          <p className="hero-subtitle">Explore thousands of job listings from top companies</p>
          
          <div className="search-container">
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Job title, keyword..." 
                className="search-input"
              />
              <input 
                type="text" 
                placeholder="Location" 
                className="search-input"
              />
              <button className="search-btn">Search</button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h3 className="section-title">Popular Categories</h3>
        <div className="categories-grid">
          {categories.map((category) => (
            <div key={category.name} className="category-card">
              <div className="category-icon">{category.icon}</div>
              <h4 className="category-name">{category.name}</h4>
              <p className="category-count">{category.count} jobs</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="jobs-section">
        <div className="section-header">
          <h3 className="section-title">Featured Jobs</h3>
          <a href="#" className="view-all-link">View All Jobs →</a>
        </div>

        <div className="jobs-container">
          {jobListings.map((job) => (
            <div key={job.id} className="job-card">
              <div className="job-header">
                <div className="job-logo">{job.logo}</div>
                <div className="job-meta">
                  <span className="job-type-badge">{job.type}</span>
                  <span className="job-posted">{job.posted}</span>
                </div>
              </div>

              <h4 className="job-title">{job.title}</h4>
              <p className="company-name">{job.company}</p>

              <div className="job-details">
                <span className="job-detail">📍 {job.location}</span>
                <span className="job-detail">💵 {job.salary}</span>
              </div>

              <button className="btn-apply">Apply Now</button>
            </div>
          ))}
        </div>
      </section>

      {/* Subscription Section */}
      <section className="subscription-section">
        <div className="subscription-content">
          <h3>Get Job Alerts</h3>
          <p>Subscribe to get personalized job recommendations delivered to your inbox</p>
          <div className="subscription-form">
            <input type="email" placeholder="Enter your email" />
            <button className="btn-subscribe">Subscribe</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>JobPortal</h4>
            <p>Find the perfect job opportunity</p>
          </div>
          <div className="footer-section">
            <h5>Quick Links</h5>
            <ul>
              <li><a href="#">Browse Jobs</a></li>
              <li><a href="#">For Companies</a></li>
              <li><a href="#">Pricing</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h5>Support</h5>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Terms</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h5>Follow Us</h5>
            <div className="social-links">
              <a href="#">LinkedIn</a>
              <a href="#">Twitter</a>
              <a href="#">Facebook</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 JobPortal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default Dashboard
