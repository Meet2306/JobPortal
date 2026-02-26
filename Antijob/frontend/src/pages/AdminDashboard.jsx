import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { LogOut, ShieldCheck, BarChart2, CheckCircle, XCircle } from 'lucide-react';

const AdminDashboard = () => {
    const { logout } = useContext(AuthContext);
    const [tab, setTab] = useState('approvals'); // approvals, analytics
    const [unverifiedUsers, setUnverifiedUsers] = useState([]);
    const [pendingJobs, setPendingJobs] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        fetchPendingApprovals();
        fetchAnalytics();
    }, []);

    const fetchPendingApprovals = async () => {
        try {
            const res = await api.get('/admin/pending');
            setUnverifiedUsers(res.data.unverifiedUsers);
            setPendingJobs(res.data.pendingJobs);
        } catch (err) { }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/admin/analytics');
            setAnalytics(res.data);
        } catch (err) { }
    };

    const verifyUser = async (userId) => {
        try {
            if (!window.confirm('Verify this user? They will be locked into the rules engine.')) return;
            await api.patch(`/admin/users/${userId}/verify`);
            fetchPendingApprovals();
        } catch (err) { alert('Failed to verify user'); }
    };

    const handleJobAction = async (jobId, status) => {
        try {
            const remarks = prompt('Enter remarks (optional):');
            await api.patch(`/admin/jobs/${jobId}/approve`, { status, remarks });
            fetchPendingApprovals();
        } catch (err) { alert('Failed to change job state'); }
    };

    return (
        <div>
            <nav className="navbar">
                <div className="navbar-brand">TPO / Admin Portal</div>
                <div className="navbar-links">
                    <span className="badge badge-info"><ShieldCheck size={14} /> SECURITY ADMIN</span>
                    <button onClick={logout} className="btn btn-outline"><LogOut size={16} /> Logout</button>
                </div>
            </nav>

            <div className="container">
                <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    <button className={`btn ${tab === 'approvals' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('approvals')}><CheckCircle size={16} /> Gatekeeper / Approvals</button>
                    <button className={`btn ${tab === 'analytics' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('analytics')}><BarChart2 size={16} /> Placement Analytics</button>
                </div>

                {tab === 'approvals' && (
                    <div className="animate-fade">
                        <h3 style={{ marginBottom: '20px' }}>Pending User Verifications</h3>
                        <div className="glass-panel" style={{ marginBottom: '40px' }}>
                            <table className="data-table">
                                <thead><tr><th>Email Address</th><th>Registered Rule</th><th>Verification Action</th></tr></thead>
                                <tbody>
                                    {unverifiedUsers.map(u => (
                                        <tr key={u._id}>
                                            <td>{u.email}</td>
                                            <td><span className={`badge ${u.role === 'student' ? 'badge-info' : 'badge-warning'}`}>{u.role.toUpperCase()}</span></td>
                                            <td><button onClick={() => verifyUser(u._id)} className="btn btn-primary btn-sm">Lock & Verify</button></td>
                                        </tr>
                                    ))}
                                    {unverifiedUsers.length === 0 && <tr><td colSpan="3">All nodes verified and system clear.</td></tr>}
                                </tbody>
                            </table>
                        </div>

                        <h3 style={{ marginBottom: '20px' }}>Pending Job Postings</h3>
                        <div className="glass-panel">
                            <table className="data-table">
                                <thead><tr><th>Job Title</th><th>Company ID (Auth)</th><th>CTC (LPA)</th><th>Decision Control</th></tr></thead>
                                <tbody>
                                    {pendingJobs.map(j => (
                                        <tr key={j._id}>
                                            <td>{j.title}</td>
                                            <td>{j.company?._id || 'Unknown'}</td>
                                            <td>₹{j.package}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button onClick={() => handleJobAction(j._id, 'Live')} className="btn btn-secondary btn-sm"><CheckCircle size={14} /> Make Live</button>
                                                    <button onClick={() => handleJobAction(j._id, 'Rejected')} className="btn btn-danger btn-sm"><XCircle size={14} /> Reject</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {pendingJobs.length === 0 && <tr><td colSpan="4">No jobs pending approval in the state machine.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'analytics' && analytics && (
                    <div className="animate-fade">
                        <h3>Real-Time Placement Statistics Pipeline</h3>
                        <div className="grid-3" style={{ marginTop: '20px', marginBottom: '40px' }}>
                            <div className="glass-panel" style={{ textAlign: 'center' }}>
                                <h4 style={{ color: 'var(--text-muted)' }}>Students Selected</h4>
                                <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{analytics.totalSelected}</p>
                                <p style={{ fontSize: '0.8rem' }}>Successfully placed via state machine tracking</p>
                            </div>
                            <div className="glass-panel" style={{ textAlign: 'center' }}>
                                <h4 style={{ color: 'var(--text-muted)' }}>Highest CTC</h4>
                                <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)' }}>₹{analytics.packageStats.highest.toFixed(2)}</p>
                                <p style={{ fontSize: '0.8rem' }}>Lowest: ₹{analytics.packageStats.lowest.toFixed(2)} | Avg: ₹{analytics.packageStats.avg.toFixed(2)}</p>
                            </div>
                        </div>

                        <h3>Company Hiring Trajectory</h3>
                        <div className="glass-panel">
                            <table className="data-table">
                                <thead><tr><th>Company Authenticator</th><th>Offers Rolled Engine</th></tr></thead>
                                <tbody>
                                    {analytics.companyHiringData.map(c => (
                                        <tr key={c._id}><td>{c._id}</td><td><span className="badge badge-success">{c.count} Hires</span></td></tr>
                                    ))}
                                    {analytics.companyHiringData.length === 0 && <tr><td colSpan="2">Aggregator currently returning mathematical zero.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
