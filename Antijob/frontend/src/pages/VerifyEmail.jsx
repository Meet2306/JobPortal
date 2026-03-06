import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { CheckCircle, XCircle, ArrowLeft, MailCheck } from 'lucide-react';

const VerifyEmail = () => {
    const { token } = useParams();
    const [status, setStatus] = useState('loading');
    const [msg, setMsg] = useState('');
    const hasFetched = React.useRef(false);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const verify = async () => {
            try {
                const res = await api.get(`/auth/verify-email/${token}`);
                setStatus('success');
                setMsg(res.data.message);
            } catch (err) {
                setStatus('error');
                setMsg(err.response?.data?.error || 'Verification failed. The link may be invalid or expired.');
            }
        };
        verify();
    }, [token]);

    return (
        <div className="auth-page">
            <div className="auth-card animate-scale-in" style={{ textAlign: 'center' }}>
                {status === 'loading' && (
                    <div className="animate-fade-in">
                        <div className="spinner-dark" style={{ width: '40px', height: '40px', margin: '0 auto 20px' }}></div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Verifying Email</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>Comparing token with our security records...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="animate-fade-in">
                        <div style={{
                            width: '64px', height: '64px', background: 'var(--success-soft)', color: 'var(--success)',
                            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)'
                        }}>
                            <CheckCircle size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Email Verified!</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: '1.6', fontSize: '0.925rem' }}>
                            {msg || 'Your account has been successfully verified. You now have full access to the portal.'}
                        </p>
                        <Link to="/login" className="btn btn-primary" style={{ width: '100%', height: '46px', fontSize: '14px', fontWeight: '700' }}>
                            Sign in to Portal
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="animate-fade-in">
                        <div style={{
                            width: '64px', height: '64px', background: 'var(--danger-soft)', color: 'var(--danger)',
                            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.15)'
                        }}>
                            <XCircle size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>Verification Link Expired</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: '1.6', fontSize: '0.925rem' }}>
                            {msg || 'For your security, verification links expire after 24 hours. Please request a new one or try registering again.'}
                        </p>
                        <Link to="/register" className="btn btn-outline" style={{ width: '100%', height: '46px', fontSize: '14px', fontWeight: '700', gap: '8px' }}>
                            <ArrowLeft size={16} /> Request New Link
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
