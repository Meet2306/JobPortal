import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import {
    UserPlus, Mail, Lock, User, Phone, GraduationCap,
    Building2, Globe, RefreshCw, AlertCircle, CheckCircle, ChevronRight
} from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '', password: '', role: 'student',
        name: '', contactNumber: '',
        companyName: '', industry: '', websiteUrl: '',
        hrContactName: '', hrContactEmail: '', hrContactNumber: '', description: '',
        captcha: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [captchaSvg, setCaptchaSvg] = useState('');
    const [captchaLoading, setCaptchaLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const refreshCaptcha = async () => {
        setCaptchaLoading(true);
        try {
            const res = await api.get('/auth/captcha');
            setCaptchaSvg(res.data);
            setFormData(prev => ({ ...prev, captcha: '' }));
            setError('');
        } catch (err) {
            console.error('Captcha fetch error:', err);
            setError('Could not connect to security service. Please refresh.');
        } finally {
            setCaptchaLoading(false);
        }
    };

    useEffect(() => { refreshCaptcha(); }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        try {
            await register(formData);
            setSuccess('Account created! Verification email sent. Redirecting...');
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            refreshCaptcha();
            setError(err.response?.data?.error || 'Registration failed. Verify all fields.');
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-card auth-card-wide animate-scale-in">
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px', height: '56px',
                        background: 'var(--primary)', borderRadius: '14px',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '20px',
                        boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
                    }}>
                        <UserPlus size={26} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Join PlacePortal</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
                        Create your account to start your journey
                    </p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="error-alert animate-fade-in">
                        <AlertCircle size={16} style={{ flexShrink: 0 }} /> <span>{error}</span>
                    </div>
                )}
                {success && (
                    <div className="success-alert animate-fade-in">
                        <CheckCircle size={16} style={{ flexShrink: 0 }} /> <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleRegister}>
                    {/* Role Picker */}
                    <div style={{ marginBottom: '28px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {[
                                { value: 'student', icon: GraduationCap, label: 'Student' },
                                { value: 'company', icon: Building2, label: 'Recruiter' }
                            ].map(opt => (
                                <button
                                    key={opt.value} type="button"
                                    onClick={() => setFormData({ ...formData, role: opt.value })}
                                    style={{
                                        padding: '14px',
                                        borderRadius: '12px',
                                        border: `2px solid ${formData.role === opt.value ? 'var(--primary)' : 'var(--border)'}`,
                                        background: formData.role === opt.value ? 'var(--primary-soft)' : 'white',
                                        color: formData.role === opt.value ? 'var(--primary)' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        fontWeight: '700', fontSize: '0.875rem',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    <opt.icon size={18} />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="divider"><span>Account Credentials</span></div>

                    <div className="grid-2" style={{ gap: '16px', marginBottom: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div className="input-with-icon">
                                <input type="email" name="email" required className="form-control" placeholder="you@university.edu" value={formData.email} onChange={handleChange} />
                                <Mail size={17} className="input-icon" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-with-icon">
                                <input type="password" name="password" required className="form-control" placeholder="Min 8 characters" value={formData.password} onChange={handleChange} />
                                <Lock size={17} className="input-icon" />
                            </div>
                        </div>
                    </div>

                    <div className="divider"><span>{formData.role === 'student' ? 'Student Profile' : 'Company Profile'}</span></div>

                    {formData.role === 'student' ? (
                        <div className="grid-2 animate-fade-in" style={{ gap: '16px', marginBottom: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <div className="input-with-icon">
                                    <input type="text" name="name" required className="form-control" placeholder="John Doe" value={formData.name} onChange={handleChange} />
                                    <User size={17} className="input-icon" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <div className="input-with-icon">
                                    <input type="text" name="contactNumber" required className="form-control" placeholder="+91 00000 00000" value={formData.contactNumber} onChange={handleChange} />
                                    <Phone size={17} className="input-icon" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in" style={{ marginBottom: '20px' }}>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label className="form-label">Company Name</label>
                                <div className="input-with-icon">
                                    <input type="text" name="companyName" required className="form-control" placeholder="Acme Technologies" value={formData.companyName} onChange={handleChange} />
                                    <Building2 size={17} className="input-icon" />
                                </div>
                            </div>
                            <div className="grid-2" style={{ gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Industry</label>
                                    <div className="input-with-icon">
                                        <input type="text" name="industry" required className="form-control" placeholder="e.g. Technology" value={formData.industry} onChange={handleChange} />
                                        <Building2 size={17} className="input-icon" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Website</label>
                                    <div className="input-with-icon">
                                        <input type="url" name="websiteUrl" className="form-control" placeholder="https://company.com" value={formData.websiteUrl} onChange={handleChange} />
                                        <Globe size={17} className="input-icon" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Captcha Section */}
                    <div className="divider"><span>Security Check</span></div>
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
                            <div
                                onClick={!captchaLoading ? refreshCaptcha : undefined}
                                style={{
                                    background: 'white', border: '1px solid var(--border)',
                                    borderRadius: '12px', cursor: 'pointer', display: 'flex',
                                    padding: '4px 12px', alignItems: 'center', justifyContent: 'center',
                                    minWidth: '140px', position: 'relative', overflow: 'hidden'
                                }}
                                title="Click to refresh"
                            >
                                {captchaLoading ? (
                                    <div className="spinner-dark"></div>
                                ) : (
                                    <div dangerouslySetInnerHTML={{ __html: captchaSvg }} style={{ height: '36px', display: 'flex', alignItems: 'center' }} />
                                )}
                            </div>
                            <button type="button" onClick={refreshCaptcha} className="btn btn-outline" style={{ width: '46px', padding: 0, borderRadius: '12px', flexShrink: 0 }} disabled={captchaLoading}>
                                <RefreshCw size={18} className={captchaLoading ? 'animate-spin' : ''} />
                            </button>
                            <div className="input-with-icon" style={{ flex: 1 }}>
                                <input name="captcha" placeholder="Enter code" className="form-control" style={{ height: '100%', borderRadius: '12px' }} value={formData.captcha} onChange={handleChange} required />
                                <Lock size={16} className="input-icon" />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', height: '48px', fontSize: '15px', fontWeight: '700', gap: '8px' }}>
                        {loading ? <div className="spinner"></div> : <>Create Account <ChevronRight size={18} /></>}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700' }}>Sign in here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
