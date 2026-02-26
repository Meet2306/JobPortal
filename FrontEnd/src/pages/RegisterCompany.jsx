import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import '../styles/Auth.css';

function RegisterCompany() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    hrName: '',
    hrEmail: '',
    hrPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/register/company', formData);
      
      if (response.success) {
        setSuccess(
          'Registration successful! Your company is awaiting admin approval. Redirecting to login...'
        );
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card auth-card-wide">
        <h1>Company Registration</h1>
        <p className="subtitle">Register your company for recruitment</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Contact Person Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Company Name</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              placeholder="TechCorp Inc."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>HR Manager Name</label>
              <input
                type="text"
                name="hrName"
                value={formData.hrName}
                onChange={handleChange}
                required
                placeholder="HR Manager"
              />
            </div>

            <div className="form-group">
              <label>HR Email</label>
              <input
                type="email"
                name="hrEmail"
                value={formData.hrEmail}
                onChange={handleChange}
                required
                placeholder="hr@company.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>HR Phone Number</label>
              <input
                type="tel"
                name="hrPhone"
                value={formData.hrPhone}
                onChange={handleChange}
                required
                placeholder="9999999999"
                pattern="\d{10}"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />
              <small className="hint">
                Must contain: 8+ chars, uppercase, lowercase, number, special char
              </small>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? 'Registering...' : 'Register Company'}
          </button>
        </form>

        <div className="auth-links">
          <p>Already have an account?</p>
          <Link to="/login" className="link">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterCompany;
