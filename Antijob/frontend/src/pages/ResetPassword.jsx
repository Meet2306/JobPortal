import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { KeyRound, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [msg, setMsg] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) return setMsg('Passwords do not match.');

        try {
            const res = await api.post(`/auth/reset-password/${token}`, { password });
            setMsg(res.data.message);
            setIsSuccess(true);
            setTimeout(() => navigate('/login'), 4000);
        } catch (err) {
            setMsg(err.response?.data?.error || 'Failed to reset password.');
        }
    };

    if (isSuccess) {
        return (
            <div className="auth-page">
                <div className="auth-card animate-scale-in" style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '64px', height: '64px', background: 'var(--success-soft)', color: 'var(--success)',
                        borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Password Updated</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '28px', lineHeight: '1.6' }}>
                        Your password has been reset successfully. Redirecting to sign in...
                    </p>
                    <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ width: '100%', height: '48px' }}>
                        Sign In Now
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-card animate-scale-in">
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px', height: '56px', background: 'var(--primary)', borderRadius: '14px',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '20px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)', color: 'white'
                    }}>
                        <KeyRound size={28} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Reset Password</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>Enter your new password below.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>New Password</label>
                        <input type="password" className="form-control" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: '8px' }}>
                        <label>Confirm Password</label>
                        <input type="password" className="form-control" placeholder="Re-enter password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    </div>

                    {msg && (
                        <div className="error-alert animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                            <AlertCircle size={16} /> {msg}
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px', marginTop: '24px' }}>
                        Reset Password
                    </button>

                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                        <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <ArrowLeft size={14} /> Back to Sign In
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
