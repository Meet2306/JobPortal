import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotMsg, setForgotMsg] = useState({ type: '', text: '' });
    const [forgotLoading, setForgotLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await login({ email, password });
            navigate(`/${data.role}`);
        } catch (err) {
            const msg = err.response?.data?.error || '';
            if (msg.toLowerCase().includes('verify')) {
                setError('📧 Please verify your email first. Check your inbox for the verification link.');
            } else {
                setError(msg || 'Invalid email or password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotLoading(true);
        setForgotMsg({ type: '', text: '' });
        try {
            await api.post('/auth/forgot-password', { email: forgotEmail });
            setForgotMsg({ type: 'success', text: 'Password reset link sent! Check your email.' });
        } catch (err) {
            setForgotMsg({ type: 'error', text: err.response?.data?.error || 'Failed to send reset link.' });
        } finally {
            setForgotLoading(false);
        }
    };

    if (showForgot) {
        return (
            <div className="auth-page">
                <div className="auth-card animate-scale-in">
                    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                        <div style={{ width: '52px', height: '52px', background: 'var(--primary)', borderRadius: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px', boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}>
                            <Mail size={26} color="white" />
                        </div>
                        <h1 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Forgot Password?</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Enter your email to receive a reset link</p>
                    </div>

                    {forgotMsg.text && (
                        <div className={forgotMsg.type === 'success' ? 'success-alert' : 'error-alert'}>
                            {forgotMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            <span>{forgotMsg.text}</span>
                        </div>
                    )}

                    <form onSubmit={handleForgotPassword}>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label className="form-label">Email Address</label>
                            <div className="input-with-icon">
                                <input type="email" required className="form-control" placeholder="you@university.edu" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                                <Mail size={17} className="input-icon" />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '46px' }} disabled={forgotLoading}>
                            {forgotLoading ? <div className="spinner"></div> : 'Send Reset Link'}
                        </button>
                    </form>

                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <button onClick={() => setShowForgot(false)} style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}>
                            ← Back to Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card animate-scale-in">
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px', height: '56px',
                        background: 'var(--primary)',
                        borderRadius: '14px',
                        display: 'inline-flex',
                        alignItems: 'center', justifyContent: 'center',
                        marginBottom: '20px',
                        boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
                    }}>
                        <Lock size={26} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Welcome back</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
                        Sign in to your placement portal account
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="error-alert animate-fade-in">
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin}>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label className="form-label">Email Address</label>
                        <div className="input-with-icon">
                            <input
                                type="email" required
                                placeholder="you@university.edu"
                                className="form-control"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Mail size={17} className="input-icon" />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '8px' }}>
                        <label className="form-label">Password</label>
                        <div className="input-with-icon">
                            <input
                                type="password" required
                                placeholder="Enter your password"
                                className="form-control"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <Lock size={17} className="input-icon" />
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                        <button type="button" onClick={() => setShowForgot(true)} style={{ fontSize: '12.5px', fontWeight: '600', color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer' }}>
                            Forgot password?
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', height: '46px', fontSize: '14px', gap: '8px' }}
                    >
                        {loading
                            ? <div className="spinner"></div>
                            : <><span>Sign In</span><ArrowRight size={16} /></>}
                    </button>
                </form>

                {/* Footer */}
                <div style={{ marginTop: '24px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '700' }}>
                            Create account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
