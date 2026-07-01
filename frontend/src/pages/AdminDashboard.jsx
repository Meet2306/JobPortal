import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import {
    LogOut, ShieldCheck, BarChart3, Users, Briefcase,
    FileCheck, Building2, TrendingUp, CheckCircle, XCircle,
    Bell, ChevronRight, Award, Layers, GraduationCap, Search
} from 'lucide-react';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';

const COLORS = ['#4F46E5', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'white', border: '1px solid #E8EAF0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            {label && <p style={{ fontWeight: 700, fontSize: 12, color: '#111827', marginBottom: 6 }}>{label}</p>}
            {payload.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4B5563', marginBottom: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color || p.fill }}></div>
                    <span>{p.name}: <strong style={{ color: '#111827' }}>{p.value}</strong></span>
                </div>
            ))}
        </div>
    );
};

const NAV = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'all-users', label: 'User Management', icon: Users },
    { key: 'applications', label: 'App Tracking', icon: Layers },
    { key: 'users', label: 'User Approvals', icon: Users },
    { key: 'jobs', label: 'Job Approvals', icon: Briefcase },
    { key: 'edits', label: 'Edit Requests', icon: FileCheck },
    { key: 'analytics', label: 'Analytics', icon: TrendingUp },
    { key: 'students', label: 'Student Tracker', icon: GraduationCap },
];

const AdminDashboard = () => {
    const { logout } = useContext(AuthContext);
    const [activeNav, setActiveNav] = useState('overview');
    const [pendingProfiles, setPendingProfiles] = useState([]);
    const [pendingJobs, setPendingJobs] = useState([]);
    const [editRequests, setEditRequests] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [jobToApprove, setJobToApprove] = useState(null);
    const [approvalData, setApprovalData] = useState({ visibility: 'All', remarks: '' });

    const [students, setStudents] = useState([]);
    const [studentSearch, setStudentSearch] = useState('');
    const [studentFilter, setStudentFilter] = useState('all'); // 'all' | 'placed' | 'unplaced'
    const [expandedStudent, setExpandedStudent] = useState(null); // student _id being expanded
    const [studentsLoading, setStudentsLoading] = useState(false);

    const [allUsers, setAllUsers] = useState([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [userFilterStatus, setUserFilterStatus] = useState('All');
    const [userFilterRole, setUserFilterRole] = useState('All');

    const [allApplications, setAllApplications] = useState([]);
    const [appSearchTerm, setAppSearchTerm] = useState('');
    const [appFilterStatus, setAppFilterStatus] = useState('All');
    const [selectedApplication, setSelectedApplication] = useState(null);

    useEffect(() => { 
        fetchPending(); 
        fetchAnalytics(); 
        fetchAllUsers();
        fetchAllApplications();
        fetchStudents();
    }, []);

    const fetchAllUsers = async () => {
        try {
            const r = await api.get('/admin/users');
            setAllUsers(r.data.users || []);
        } catch (e) { console.error('Fetch Users Error:', e); }
    };

    const fetchAllApplications = async () => {
        try {
            const r = await api.get('/admin/applications');
            setAllApplications(r.data.applications || []);
        } catch (e) { console.error('Fetch Applications Error:', e); }
    };

    const fetchStudents = async () => {
        setStudentsLoading(true);
        try {
            const r = await api.get('/admin/students-tracking');
            setStudents(r.data || []);
        } catch (e) {
            console.error('Fetch Students Error:', e);
        } finally {
            setStudentsLoading(false);
        }
    };

    const fetchPending = async () => {
        try {
            const r = await api.get('/admin/pending');
            const students = (r.data.pendingStudents || []).map(s => ({ ...s, roleType: 'student' }));
            const companies = (r.data.pendingCompanies || []).map(c => ({ ...c, roleType: 'company' }));
            setPendingProfiles([...students, ...companies]);
            setPendingJobs(r.data.pendingJobs || []);
            setEditRequests(r.data.editRequests || []);
        } catch (e) {
            console.error('Fetch Pending Error:', e);
        }
    };

    const fetchAnalytics = async () => {
        try { const r = await api.get('/admin/analytics'); setAnalytics(r.data); } catch (e) { }
    };

    const approveProfile = async (id, roleType) => {
        if (!window.confirm('Approve this profile?')) return;
        try { 
            await api.patch(`/admin/profiles/${roleType}/${id}/approve`); 
            setSelectedUser(null); 
            fetchPending(); 
        } catch (e) { alert('Failed to approve'); }
    };

    const rejectProfile = async (id, roleType) => {
        const reason = prompt('Reason for rejection:');
        if (!reason) return;
        try { 
            await api.patch(`/admin/profiles/${roleType}/${id}/reject`, { reason }); 
            setSelectedUser(null); 
            fetchPending(); 
        } catch (e) { alert('Failed to reject'); }
    };

    const handleJobAction = async (jobId, status) => {
        if (status === 'Rejected') {
            if (!window.confirm('Reject this job posting?')) return;
            try {
                const remarks = prompt('Rejection Remarks (optional):') || '';
                await api.patch(`/admin/jobs/${jobId}/approve`, { status, remarks });
                fetchPending();
            } catch (e) { alert('Failed'); }
        } else {
            const job = pendingJobs.find(p => p._id === jobId);
            setJobToApprove(job);
            setApprovalData({ visibility: 'All', remarks: '' });
        }
    };

    const submitApproval = async () => {
        if (!jobToApprove) return;
        try {
            await api.patch(`/admin/jobs/${jobToApprove._id}/approve`, {
                status: 'Live',
                visibility: approvalData.visibility,
                remarks: approvalData.remarks
            });
            setJobToApprove(null);
            fetchPending();
        } catch (e) {
            alert('Failed to approve job');
        }
    };

    const handleEditRequest = async (profileId, action, role) => {
        try { await api.patch(`/admin/profiles/${profileId}/edit-permission`, { action, role }); fetchPending(); } catch (e) { alert('Failed'); }
    };

    const totalPending = pendingProfiles.length + pendingJobs.length + editRequests.length;

    /* Pie data: user types */
    const userTypePie = [
        { name: 'Students', value: pendingProfiles.filter(u => u.roleType === 'student').length },
        { name: 'Companies', value: pendingProfiles.filter(u => u.roleType === 'company').length },
    ].filter(d => d.value > 0);

    const companyHiringBar = analytics?.companyHiringData?.slice(0, 8).map(c => ({
        company: c._id?.length > 12 ? c._id.slice(0, 12) + '…' : c._id,
        selections: c.count,
    })) || [];

    // Filtered lists
    const filteredUsers = allUsers.filter(u => {
        const matchesSearch = u.fullName.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(userSearchTerm.toLowerCase());
        const matchesStatus = userFilterStatus === 'All' || u.approvalStatus === userFilterStatus;
        const matchesRole = userFilterRole === 'All' || u.role === userFilterRole;
        return matchesSearch && matchesStatus && matchesRole;
    });

    const filteredApplications = allApplications.filter(app => {
        const matchesSearch = app.studentName.toLowerCase().includes(appSearchTerm.toLowerCase()) ||
            app.appliedCompanyName.toLowerCase().includes(appSearchTerm.toLowerCase()) ||
            app.jobRole.toLowerCase().includes(appSearchTerm.toLowerCase());
        const matchesStatus = appFilterStatus === 'All' || app.status === appFilterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="app-layout">
            {/* ── SIDEBAR ── */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <ShieldCheck size={20} color="white" />
                    </div>
                    <div>
                        <div className="sidebar-logo-text">PlacePortal</div>
                        <span className="sidebar-logo-sub">Admin Console</span>
                    </div>
                </div>

                <div className="sidebar-body">
                    <span className="sidebar-section-label">Management</span>
                    {NAV.map(item => {
                        const Icon = item.icon;
                        const count = item.key === 'users' ? pendingProfiles.length : item.key === 'jobs' ? pendingJobs.length : item.key === 'edits' ? editRequests.length : 0;
                        return (
                            <button key={item.key} className={`sidebar-link ${activeNav === item.key ? 'active' : ''}`} onClick={() => setActiveNav(item.key)}>
                                <Icon size={17} />
                                <span>{item.label}</span>
                                {count > 0 && <span className="sidebar-link-badge">{count}</span>}
                            </button>
                        );
                    })}
                </div>

                <div className="sidebar-footer">
                    <div className="sidebar-user" onClick={logout} title="Sign out" style={{ cursor: 'pointer' }}>
                        <div className="sidebar-user-avatar" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>A</div>
                        <div style={{ flex: 1 }}>
                            <div className="sidebar-user-name">Administrator</div>
                            <div className="sidebar-user-role">TPO Office</div>
                        </div>
                        <LogOut size={15} color="var(--danger)" />
                    </div>
                </div>
            </aside>

            {/* ── MAIN ── */}
            <div className="main-wrapper">
                <nav className="navbar">
                    <div className="navbar-left">
                        <div>
                            <div className="navbar-page-title">
                                {NAV.find(n => n.key === activeNav)?.label || 'Admin'}
                            </div>
                            {/* <div className="navbar-breadcrumb">PlacePortal / Admin / {activeNav}</div> */}
                        </div>
                    </div>
                    <div className="navbar-right">
                        {totalPending > 0 && (
                            <span className="badge badge-danger">
                                <span className="badge-dot"></span>
                                {totalPending} Pending
                            </span>
                        )}
                        <button className="navbar-icon-btn">
                            <Bell size={16} />
                            {totalPending > 0 && <span className="navbar-badge">{totalPending}</span>}
                        </button>
                        <div className="navbar-profile">
                            <div className="navbar-profile-avatar" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>A</div>
                            <div>
                                <div className="navbar-profile-name">Administrator</div>
                                <div className="navbar-profile-role">TPO Office</div>
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="page-content">
                    <div className="animate-fade-up">

                        {/* ── OVERVIEW ── */}
                        {activeNav === 'overview' && (
                            <>
                                {/* Hero */}
                                <div style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', borderRadius: 'var(--r-2xl)', padding: '28px 32px', marginBottom: 24, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ opacity: 0.8, fontSize: 13, marginBottom: 4 }}>Good day, Administrator 👋</p>
                                        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 6 }}>Admin Control Panel</h1>
                                        <p style={{ opacity: 0.8, fontSize: 13 }}>Placement Portal — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 36, fontWeight: 900, color: 'white' }}>{totalPending}</div>
                                        <div style={{ opacity: 0.8, fontSize: 13 }}>Items pending review</div>
                                    </div>
                                </div>

                                <div className="stat-grid stagger" style={{ marginBottom: 24 }}>
                                    {[
                                        { label: 'Users Pending', value: pendingProfiles.length, icon: Users, color: 'var(--primary)', soft: 'var(--primary-soft)' },
                                        { label: 'Jobs Pending', value: pendingJobs.length, icon: Briefcase, color: 'var(--warning)', soft: 'var(--warning-soft)' },
                                        { label: 'Edit Requests', value: editRequests.length, icon: FileCheck, color: 'var(--purple)', soft: 'var(--purple-soft)' },
                                        { label: 'Total Selected', value: analytics?.totalSelected || 0, icon: Award, color: 'var(--success)', soft: 'var(--success-soft)' },
                                    ].map((card, i) => {
                                        const Icon = card.icon;
                                        return (
                                            <div key={i} className="stat-card animate-fade-up" style={{ '--stat-color': card.color, '--stat-soft': card.soft, animationDelay: `${i * 0.07}s` }}>
                                                <div className="stat-card-top">
                                                    <div className="stat-card-icon"><Icon size={20} /></div>
                                                    <span className={`stat-card-trend ${card.value > 0 ? 'trend-down' : 'trend-neutral'}`}>
                                                        {card.value > 0 ? '!' : '✓'}
                                                    </span>
                                                </div>
                                                <div className="stat-card-value">{card.value}</div>
                                                <div className="stat-card-label">{card.label}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                                    {/* Pending breakdown pie */}
                                    <div className="chart-card">
                                        <div className="card-header">
                                            <div className="card-title">Pending Users by Type</div>
                                        </div>
                                        {userTypePie.length > 0 ? (
                                            <>
                                                <ResponsiveContainer width="100%" height={160}>
                                                    <PieChart>
                                                        <Pie data={userTypePie} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={4} dataKey="value">
                                                            {userTypePie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                                        </Pie>
                                                        <Tooltip content={<CustomTooltip />} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                                                    {userTypePie.map((d, i) => (
                                                        <div key={i} className="legend-item">
                                                            <div className="legend-dot" style={{ background: COLORS[i] }}></div>
                                                            {d.name}: <strong>{d.value}</strong>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="empty-state"><div className="empty-state-icon" style={{ margin: '0 auto 12px' }}><CheckCircle size={24} /></div><p>All users verified!</p></div>
                                        )}
                                    </div>

                                    {/* Quick actions */}
                                    <div className="chart-card">
                                        <div className="card-title" style={{ marginBottom: 16 }}>Quick Actions</div>
                                        {[
                                            { label: 'Review User Verifications', count: pendingProfiles.length, nav: 'users', color: 'var(--primary)' },
                                            { label: 'Review Job Postings', count: pendingJobs.length, nav: 'jobs', color: 'var(--warning)' },
                                            { label: 'Review Edit Requests', count: editRequests.length, nav: 'edits', color: 'var(--purple)' },
                                            { label: 'View Placement Analytics', count: null, nav: 'analytics', color: 'var(--success)' },
                                        ].map((action, i) => (
                                            <button key={i} onClick={() => setActiveNav(action.nav)} className="metric-row" style={{ width: '100%', cursor: 'pointer' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: 2, background: action.color, flexShrink: 0 }}></div>
                                                    <span className="metric-label">{action.label}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {action.count !== null && <span className="metric-value" style={{ color: action.count > 0 ? action.color : 'var(--success)' }}>{action.count}</span>}
                                                    <ChevronRight size={14} color="var(--text-muted)" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Recent pending users */}
                                {pendingProfiles.length > 0 && (
                                    <div className="table-card">
                                        <div className="table-header">
                                            <div className="table-title">Pending User Verifications</div>
                                            <button className="btn btn-outline btn-sm" onClick={() => setActiveNav('users')}>View All</button>
                                        </div>
                                        <table className="data-table">
                                            <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Action</th></tr></thead>
                                            <tbody>
                                                {pendingProfiles.slice(0, 5).map(u => (
                                                    <tr key={u._id}>
                                                        <td className="cell-primary">{u.roleType === 'student' ? u.name : u.companyName || 'N/A'}</td>
                                                        <td><span className={`badge ${u.roleType === 'student' ? 'badge-blue' : 'badge-purple'}`}>{u.roleType === 'student' ? 'Student' : 'Company'}</span></td>
                                                        <td>{u.user?.email || 'N/A'}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: 8 }}>
                                                                <button onClick={() => setSelectedUser(u)} className="btn btn-outline btn-sm">View</button>
                                                                <button onClick={() => approveProfile(u._id, u.roleType)} className="btn btn-success btn-sm">Approve</button>
                                                                <button onClick={() => rejectProfile(u._id, u.roleType)} className="btn btn-danger btn-sm">Reject</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── USER MANAGEMENT (ALL USERS) ── */}
                        {activeNav === 'all-users' && (
                            <>
                                <div className="page-header page-header-row">
                                    <div><h1>User Directory</h1><p>Manage all registered students and companies</p></div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '6px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', gap: 8 }}>
                                            <Search size={16} color="var(--text-muted)" />
                                            <input
                                                type="text"
                                                placeholder="Search users..."
                                                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, width: 200 }}
                                                value={userSearchTerm}
                                                onChange={e => setUserSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <select
                                            className="auth-input-field"
                                            style={{ height: 'auto', padding: '6px 12px', width: 'auto' }}
                                            value={userFilterStatus}
                                            onChange={e => setUserFilterStatus(e.target.value)}
                                        >
                                            <option value="All">All Status</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Pending">Pending</option>
                                        </select>
                                        <select
                                            className="auth-input-field"
                                            style={{ height: 'auto', padding: '6px 12px', width: 'auto' }}
                                            value={userFilterRole}
                                            onChange={e => setUserFilterRole(e.target.value)}
                                        >
                                            <option value="All">All Roles</option>
                                            <option value="student">Student</option>
                                            <option value="company">Company</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="table-card">
                                    <div className="table-header"><div className="table-title">Registered Users ({filteredUsers.length})</div></div>
                                    <table className="data-table">
                                        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Document</th><th>Profile</th><th>Status</th></tr></thead>
                                        <tbody>
                                            {filteredUsers.map(u => (
                                                <tr key={u._id}>
                                                    <td className="cell-primary">{u.fullName}</td>
                                                    <td>{u.email}</td>
                                                    <td><span className={`badge ${u.role === 'student' ? 'badge-blue' : 'badge-purple'}`}><span className="badge-dot"></span>{u.role === 'student' ? 'Student' : 'Company'}</span></td>
                                                    <td>
                                                        {u.documentUrl ? (
                                                            <a 
                                                                href={u.documentUrl.startsWith('http') ? u.documentUrl : (import.meta.env.PROD ? u.documentUrl : `http://localhost:5000${u.documentUrl}`)} 
                                                                target="_blank" 
                                                                rel="noreferrer" 
                                                                style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                                                            >
                                                                <FileCheck size={14} /> {u.role === 'student' ? 'View CV' : 'View Reg. Doc'}
                                                            </a>
                                                        ) : (
                                                            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No Document</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${u.profileCompletionStatus === 'Complete' ? 'badge-success' : 'badge-warning'}`}>
                                                            {u.profileCompletionStatus}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${u.approvalStatus === 'Approved' ? 'badge-success' : 'badge-danger'}`}>
                                                            {u.approvalStatus}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredUsers.length === 0 && (
                                                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon" style={{ margin: '0 auto 12px' }}><Users size={24} /></div><h3>No users found</h3><p>Try adjusting your search or filter</p></div></td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* ── APPLICATION TRACKING ── */}
                        {activeNav === 'applications' && (
                            <>
                                <div className="page-header page-header-row">
                                    <div><h1>Application Tracker</h1><p>Monitor all student job applications</p></div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '6px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', gap: 8 }}>
                                            <Search size={16} color="var(--text-muted)" />
                                            <input
                                                type="text"
                                                placeholder="Search student, company..."
                                                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, width: 220 }}
                                                value={appSearchTerm}
                                                onChange={e => setAppSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <select
                                            className="auth-input-field"
                                            style={{ height: 'auto', padding: '6px 12px', width: 'auto' }}
                                            value={appFilterStatus}
                                            onChange={e => setAppFilterStatus(e.target.value)}
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="Applied">Applied</option>
                                            <option value="Shortlisted">Shortlisted</option>
                                            <option value="Interview Scheduled">Interview Scheduled</option>
                                            <option value="Selected">Selected</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="table-card">
                                    <div className="table-header"><div className="table-title">Job Applications ({filteredApplications.length})</div></div>
                                    <table className="data-table">
                                        <thead><tr><th>Student</th><th>Company</th><th>Role</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {filteredApplications.map(app => (
                                                <tr key={app._id}>
                                                    <td className="cell-primary">
                                                        <div>{app.studentName}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{app.studentEmail}</div>
                                                    </td>
                                                    <td style={{ fontWeight: 600 }}>{app.appliedCompanyName}</td>
                                                    <td>{app.jobRole}</td>
                                                    <td>{new Date(app.applicationDate).toLocaleDateString()}</td>
                                                    <td>
                                                        <span className={`badge ${app.status === 'Selected' ? 'badge-success' :
                                                                app.status === 'Rejected' ? 'badge-danger' :
                                                                    app.status === 'Applied' ? 'badge-blue' : 'badge-warning'
                                                            }`}>
                                                            {app.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-outline btn-sm"
                                                            onClick={() => setSelectedApplication(app)}
                                                        >
                                                            History
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredApplications.length === 0 && (
                                                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon" style={{ margin: '0 auto 12px' }}><Layers size={24} /></div><h3>No applications found</h3><p>Try adjusting your search or filter</p></div></td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* ── USER APPROVALS ── */}
                        {activeNav === 'users' && (
                            <>
                                <div className="page-header page-header-row">
                                    <div><h1>User Verifications</h1><p>Approve or reject user registration requests</p></div>
                                    <span className="badge badge-warning">{pendingProfiles.length} Pending</span>
                                </div>
                                <div className="table-card">
                                    <div className="table-header"><div className="table-title">Pending Users</div></div>
                                    <table className="data-table">
                                        <thead><tr><th>Name / Company</th><th>Role</th><th>Email</th><th>Contact</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {pendingProfiles.map(u => (
                                                <tr key={u._id}>
                                                    <td className="cell-primary">{u.roleType === 'student' ? u.name : u.companyName || 'N/A'}</td>
                                                    <td><span className={`badge ${u.roleType === 'student' ? 'badge-blue' : 'badge-purple'}`}><span className="badge-dot"></span>{u.roleType === 'student' ? 'Student' : 'Company'}</span></td>
                                                    <td>{u.user?.email || 'N/A'}</td>
                                                    <td>{u.roleType === 'student' ? u.contactNumber : u.hrContactNumber || '—'}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                            <button onClick={() => setSelectedUser(u)} className="btn btn-outline btn-sm">Details</button>
                                                            <button onClick={() => approveProfile(u._id, u.roleType)} className="btn btn-success btn-sm">Approve</button>
                                                            <button onClick={() => rejectProfile(u._id, u.roleType)} className="btn btn-danger btn-sm">Reject</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {pendingProfiles.length === 0 && (
                                                <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-icon" style={{ margin: '0 auto 12px' }}><CheckCircle size={24} /></div><h3>All clear!</h3><p>No pending user verifications</p></div></td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* ── JOB APPROVALS ── */}
                        {activeNav === 'jobs' && (
                            <>
                                <div className="page-header page-header-row">
                                    <div><h1>Job Approvals</h1><p>Review and approve job postings from companies</p></div>
                                    <span className="badge badge-warning">{pendingJobs.length} Pending</span>
                                </div>
                                <div className="table-card">
                                    <div className="table-header"><div className="table-title">Pending Jobs</div></div>
                                    <table className="data-table">
                                        <thead><tr><th>Job Title</th><th>Company</th><th>Package</th><th>Location</th><th>Min CGPA</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {pendingJobs.map(j => (
                                                <tr key={j._id}>
                                                    <td className="cell-primary">{j.title}</td>
                                                    <td>{j.company?.companyName}</td>
                                                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{j.package} LPA</td>
                                                    <td>{j.location || '—'}</td>
                                                    <td>{j.criteria?.minCGPA || '—'}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                            <button onClick={() => handleJobAction(j._id, 'Live')} className="btn btn-success btn-sm">Approve</button>
                                                            <button onClick={() => handleJobAction(j._id, 'Rejected')} className="btn btn-danger btn-sm">Reject</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {pendingJobs.length === 0 && (
                                                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon" style={{ margin: '0 auto 12px' }}><Briefcase size={24} /></div><h3>No pending jobs</h3><p>All job postings have been reviewed</p></div></td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* ── EDIT REQUESTS ── */}
                        {activeNav === 'edits' && (
                            <>
                                <div className="page-header page-header-row">
                                    <div><h1>Edit Requests</h1><p>Grant or deny profile edit permissions</p></div>
                                    <span className="badge badge-purple">{editRequests.length} Pending</span>
                                </div>
                                <div className="table-card">
                                    <div className="table-header"><div className="table-title">Pending Edit Requests</div></div>
                                    <table className="data-table">
                                        <thead><tr><th>Name</th><th>Role</th><th>Detail</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {editRequests.map(r => (
                                                <tr key={r._id}>
                                                    <td className="cell-primary">{r.role === 'student' ? r.name : r.companyName || 'N/A'}</td>
                                                    <td><span className={`badge ${r.role === 'student' ? 'badge-blue' : 'badge-purple'}`}>{r.role === 'student' ? 'Student' : 'Company'}</span></td>
                                                    <td style={{ color: 'var(--text-muted)' }}>{r.role === 'student' ? `CGPA: ${r.education?.cgpa || r.cgpa || '—'}` : `Industry: ${r.industry || '—'}`}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 8 }}>
                                                            <button onClick={() => handleEditRequest(r._id, 'approve', r.role)} className="btn btn-success btn-sm">Grant</button>
                                                            <button onClick={() => handleEditRequest(r._id, 'reject', r.role)} className="btn btn-outline btn-sm">Deny</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {editRequests.length === 0 && (
                                                <tr><td colSpan={4}><div className="empty-state"><div className="empty-state-icon" style={{ margin: '0 auto 12px' }}><FileCheck size={24} /></div><h3>No edit requests</h3></div></td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* ── ANALYTICS ── */}
                        {activeNav === 'analytics' && analytics && (
                            <>
                                <div className="page-header">
                                    <h1>Placement Analytics</h1>
                                    <p>Comprehensive overview of placement outcomes and statistics</p>
                                </div>

                                <div className="stat-grid stagger" style={{ marginBottom: 24 }}>
                                    {[
                                        { label: 'Total Selected', value: analytics.totalSelected, icon: CheckCircle, color: 'var(--success)', soft: 'var(--success-soft)' },
                                        { label: 'Companies Active', value: analytics.companyHiringData?.length || 0, icon: Building2, color: 'var(--purple)', soft: 'var(--purple-soft)' },
                                    ].map((card, i) => {
                                        const Icon = card.icon;
                                        return (
                                            <div key={i} className="stat-card" style={{ '--stat-color': card.color, '--stat-soft': card.soft }}>
                                                <div className="stat-card-top">
                                                    <div className="stat-card-icon"><Icon size={20} /></div>
                                                    <span className="stat-card-trend trend-up">↑</span>
                                                </div>
                                                <div className="stat-card-value" style={{ fontSize: typeof card.value === 'string' ? 22 : 30 }}>{card.value}</div>
                                                <div className="stat-card-label">{card.label}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
                                    <div className="chart-card">
                                        <div className="card-header">
                                            <div className="card-title">Company-wise Selections</div>
                                            <div className="card-subtitle">Top hiring companies by selections</div>
                                        </div>
                                        <ResponsiveContainer width="100%" height={240}>
                                            <BarChart data={companyHiringBar} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF0" horizontal={false} />
                                                <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                                <YAxis dataKey="company" type="category" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={90} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="selections" fill="var(--primary)" radius={[0, 6, 6, 0]} name="Selections" maxBarSize={30} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="chart-card">
                                        <div className="card-title" style={{ marginBottom: 16 }}>Hiring Share</div>
                                        <ResponsiveContainer width="100%" height={160}>
                                            <PieChart>
                                                <Pie data={analytics.companyHiringData?.slice(0, 6)} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={70} paddingAngle={3}>
                                                    {analytics.companyHiringData?.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                                            {analytics.companyHiringData?.slice(0, 4).map((c, i) => (
                                                <div key={i} className="metric-row">
                                                    <div className="legend-item">
                                                        <div className="legend-dot" style={{ background: COLORS[i % COLORS.length] }}></div>
                                                        <span className="metric-label" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{c._id}</span>
                                                    </div>
                                                    <span className="metric-value">{Math.round((c.count / analytics.totalSelected) * 100)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Selections table */}
                                <div className="table-card">
                                    <div className="table-header"><div className="table-title">All Company Selections</div></div>
                                    <table className="data-table">
                                        <thead><tr><th>Company</th><th>Selections</th><th>Share</th><th>Progress</th></tr></thead>
                                        <tbody>
                                            {analytics.companyHiringData?.map((c, i) => (
                                                <tr key={c._id}>
                                                    <td className="cell-primary">{c._id}</td>
                                                    <td><span className="badge badge-success">{c.count} selected</span></td>
                                                    <td style={{ fontWeight: 600 }}>{Math.round((c.count / analytics.totalSelected) * 100)}%</td>
                                                    <td style={{ width: 140 }}>
                                                        <div className="progress-track">
                                                            <div className="progress-fill" style={{ width: `${(c.count / analytics.totalSelected) * 100}%`, background: COLORS[i % COLORS.length] }}></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* ── STUDENT TRACKER ── */}
                        {activeNav === 'students' && (
                            <div>
                                {/* Header Banner */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                    borderRadius: 'var(--r-2xl)', padding: '24px 28px',
                                    marginBottom: 20, color: 'white',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <p style={{ opacity: 0.85, fontSize: 13, marginBottom: 4 }}>Placement Overview</p>
                                        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 4 }}>
                                            Student Tracker
                                        </h2>
                                        <p style={{ opacity: 0.8, fontSize: 13 }}>
                                            View all students, their applications, and placement status
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 32, fontWeight: 900, color: 'white' }}>
                                            {students.filter(s => s.isPlaced).length}
                                        </div>
                                        <div style={{ opacity: 0.8, fontSize: 13 }}>Students Placed</div>
                                    </div>
                                </div>

                                {/* Summary Stats Row */}
                                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                                    {[
                                        { label: 'Total Students', value: students.length, color: '#4F46E5', soft: 'rgba(79,70,229,0.1)' },
                                        { label: 'Placed', value: students.filter(s => s.isPlaced).length, color: '#059669', soft: 'rgba(5,150,105,0.1)' },
                                        { label: 'Not Placed', value: students.filter(s => !s.isPlaced).length, color: '#D97706', soft: 'rgba(217,119,6,0.1)' },
                                        { label: 'Total Applications', value: students.reduce((a, s) => a + s.totalApplications, 0), color: '#7C3AED', soft: 'rgba(124,58,237,0.1)' },
                                    ].map((stat, i) => (
                                        <div key={i} className="stat-card" style={{
                                            '--stat-color': stat.color, '--stat-soft': stat.soft,
                                            flex: '1 1 140px', minWidth: 140
                                        }}>
                                            <div className="stat-card-label">{stat.label}</div>
                                            <div className="stat-card-value">{stat.value}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Search + Filter Bar */}
                                <div className="card" style={{ marginBottom: 16, padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                        {/* Search */}
                                        <div style={{ position: 'relative', flex: '1 1 220px' }}>
                                            <Search size={15} style={{
                                                position: 'absolute', left: 10, top: '50%',
                                                transform: 'translateY(-50%)', color: 'var(--text-muted)'
                                            }} />
                                            <input
                                                type="text"
                                                placeholder="Search by name, branch, company..."
                                                value={studentSearch}
                                                onChange={e => setStudentSearch(e.target.value)}
                                                style={{
                                                    width: '100%', paddingLeft: 32, paddingRight: 12,
                                                    height: 36, borderRadius: 8, fontSize: 13,
                                                    border: '1px solid var(--border)',
                                                    background: 'var(--bg)', color: 'var(--text)',
                                                    outline: 'none', boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>
                                        {/* Filter Buttons */}
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {[
                                                { key: 'all', label: 'All Students' },
                                                { key: 'placed', label: '✅ Placed' },
                                                { key: 'unplaced', label: '⏳ Not Placed' },
                                            ].map(f => (
                                                <button key={f.key} onClick={() => setStudentFilter(f.key)}
                                                    style={{
                                                        padding: '6px 14px', borderRadius: 20, fontSize: 12,
                                                        fontWeight: 600, cursor: 'pointer',
                                                        background: studentFilter === f.key ? 'var(--primary)' : 'var(--bg)',
                                                        color: studentFilter === f.key ? 'white' : 'var(--text-muted)',
                                                        border: studentFilter === f.key ? 'none' : '1px solid var(--border)',
                                                        transition: 'all 0.15s'
                                                    }}>
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Student List */}
                                {studentsLoading ? (
                                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                        Loading students...
                                    </div>
                                ) : (() => {
                                    const q = studentSearch.toLowerCase();
                                    const filtered = students.filter(s => {
                                        const matchSearch = !q
                                            || s.name?.toLowerCase().includes(q)
                                            || s.branch?.toLowerCase().includes(q)
                                            || s.email?.toLowerCase().includes(q)
                                            || s.selectedCompany?.companyName?.toLowerCase().includes(q)
                                            || s.applications?.some(a => a.companyName?.toLowerCase().includes(q));
                                        const matchFilter =
                                            studentFilter === 'all' ||
                                            (studentFilter === 'placed' && s.isPlaced) ||
                                            (studentFilter === 'unplaced' && !s.isPlaced);
                                        return matchSearch && matchFilter;
                                    });

                                    if (filtered.length === 0) return (
                                        <div className="card">
                                            <div className="empty-state">
                                                <div className="empty-state-icon" style={{ margin: '0 auto 12px' }}>
                                                    <GraduationCap size={24} />
                                                </div>
                                                <h3>No students found</h3>
                                                <p>Try adjusting your search or filter</p>
                                            </div>
                                        </div>
                                    );

                                    return (
                                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                                                        {['Student', 'Branch / CGPA', 'Applications', 'Status', 'Selected Company', ''].map((h, i) => (
                                                            <th key={i} style={{
                                                                padding: '12px 16px', textAlign: 'left',
                                                                fontSize: 12, fontWeight: 600,
                                                                color: 'var(--text-muted)', whiteSpace: 'nowrap'
                                                            }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filtered.map((s, idx) => (
                                                        <React.Fragment key={s._id}>
                                                            {/* Main Row */}
                                                            <tr style={{
                                                                borderBottom: '1px solid var(--border)',
                                                                background: expandedStudent === s._id ? 'rgba(79,70,229,0.04)' : 'transparent',
                                                                transition: 'background 0.15s'
                                                            }}>
                                                                {/* Student Name + Email */}
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                                        <div style={{
                                                                            width: 34, height: 34, borderRadius: '50%',
                                                                            background: s.isPlaced ? 'rgba(5,150,105,0.15)' : 'rgba(79,70,229,0.12)',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            fontSize: 13, fontWeight: 700,
                                                                            color: s.isPlaced ? '#059669' : '#4F46E5', flexShrink: 0,
                                                                            overflow: 'hidden'
                                                                        }}>
                                                                            {s.profilePhoto
                                                                                ? <img src={s.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                                                : s.name?.charAt(0)?.toUpperCase() || 'S'
                                                                            }
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{s.name || '—'}</div>
                                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.email || '—'}</div>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* Branch / CGPA */}
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{s.branch}</div>
                                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                                        CGPA: <strong style={{ color: 'var(--text)' }}>{s.cgpa}</strong>
                                                                        {s.passingYear && ` · ${s.passingYear}`}
                                                                    </div>
                                                                </td>

                                                                {/* Applications count */}
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    <span style={{
                                                                        background: 'rgba(79,70,229,0.1)', color: '#4F46E5',
                                                                        borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700
                                                                    }}>
                                                                        {s.totalApplications} applied
                                                                    </span>
                                                                </td>

                                                                {/* Placement Status Badge */}
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    {s.isPlaced ? (
                                                                        <span className="badge badge-success">✅ Placed</span>
                                                                    ) : s.totalApplications > 0 ? (
                                                                        <span className="badge badge-warning">⏳ In Process</span>
                                                                    ) : (
                                                                        <span className="badge" style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                                                            Not Applied
                                                                        </span>
                                                                    )}
                                                                </td>

                                                                {/* Selected Company */}
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    {s.isPlaced ? (
                                                                        <div>
                                                                            <div style={{ fontWeight: 600, fontSize: 13, color: '#059669' }}>
                                                                                {s.selectedCompany?.companyName}
                                                                            </div>
                                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                                                {s.selectedCompany?.jobTitle}
                                                                                {s.selectedCompany?.package > 0 && ` · ₹${s.selectedCompany.package} LPA`}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>
                                                                    )}
                                                                </td>

                                                                {/* Expand Button */}
                                                                <td style={{ padding: '12px 16px' }}>
                                                                    {s.totalApplications > 0 && (
                                                                        <button
                                                                            onClick={() => setExpandedStudent(expandedStudent === s._id ? null : s._id)}
                                                                            style={{
                                                                                background: 'none', border: '1px solid var(--border)',
                                                                                borderRadius: 6, padding: '4px 10px',
                                                                                cursor: 'pointer', fontSize: 12,
                                                                                color: 'var(--text-muted)',
                                                                                transition: 'all 0.15s'
                                                                            }}>
                                                                            {expandedStudent === s._id ? '▲ Hide' : '▼ Details'}
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>

                                                            {/* Expanded Applications Row */}
                                                            {expandedStudent === s._id && s.applications?.length > 0 && (
                                                                <tr key={`${s._id}-exp`}>
                                                                    <td colSpan={6} style={{ padding: 0, background: 'rgba(79,70,229,0.03)' }}>
                                                                        <div style={{ padding: '12px 20px 16px 60px', borderBottom: '2px solid var(--border)' }}>
                                                                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                                                All Applications ({s.applications.length})
                                                                            </div>
                                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                                                {s.applications.map((app, ai) => {
                                                                                    const statusColors = {
                                                                                        'Applied': { bg: 'rgba(37,99,235,0.1)', color: '#2563EB' },
                                                                                        'Shortlisted': { bg: 'rgba(217,119,6,0.1)', color: '#D97706' },
                                                                                        'Interview Scheduled': { bg: 'rgba(124,58,237,0.1)', color: '#7C3AED' },
                                                                                        'Selected': { bg: 'rgba(5,150,105,0.1)', color: '#059669' },
                                                                                        'Rejected': { bg: 'rgba(220,38,38,0.1)', color: '#DC2626' },
                                                                                    };
                                                                                    const sc = statusColors[app.status] || { bg: 'var(--bg)', color: 'var(--text-muted)' };
                                                                                    return (
                                                                                        <div key={ai} style={{
                                                                                            display: 'flex', alignItems: 'center',
                                                                                            gap: 12, padding: '8px 12px',
                                                                                            background: 'var(--surface)',
                                                                                            borderRadius: 8, flexWrap: 'wrap',
                                                                                            border: app.status === 'Selected' ? '1px solid rgba(5,150,105,0.3)' : '1px solid transparent'
                                                                                        }}>
                                                                                            {/* Company + Job */}
                                                                                            <div style={{ flex: '1 1 160px', minWidth: 120 }}>
                                                                                                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                                                                                                    {app.companyName}
                                                                                                </div>
                                                                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                                                                    {app.jobTitle}
                                                                                                </div>
                                                                                            </div>
                                                                                            {/* Package */}
                                                                                            {app.package > 0 && (
                                                                                                <div style={{ fontSize: 12, color: '#4F46E5', fontWeight: 700, minWidth: 70 }}>
                                                                                                    ₹{app.package} LPA
                                                                                                </div>
                                                                                            )}
                                                                                            {/* Location */}
                                                                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 80 }}>
                                                                                                📍 {app.location}
                                                                                            </div>
                                                                                            {/* Applied Date */}
                                                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 80 }}>
                                                                                                {new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                                            </div>
                                                                                            {/* Status Badge */}
                                                                                            <span style={{
                                                                                                background: sc.bg, color: sc.color,
                                                                                                borderRadius: 20, padding: '3px 10px',
                                                                                                fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap'
                                                                                            }}>
                                                                                                {app.status}
                                                                                            </span>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* ── USER DETAIL MODAL ── */}
            {selectedUser && (
                <div className="modal-overlay animate-fade-in" onClick={() => setSelectedUser(null)}>
                    <div className="modal-card animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title">User Profile Review</div>
                            <div className="modal-subtitle">Review before approving or rejecting this {selectedUser.role}</div>
                        </div>

                        <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-lg)', padding: 20, marginBottom: 24 }}>
                            <div className="grid-2" style={{ gap: 16 }}>
                                {selectedUser.roleType === 'student' ? (
                                    <>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Name</div>
                                            <div style={{ fontWeight: 600 }}>{selectedUser.name || '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Phone</div>
                                            <div style={{ fontWeight: 600 }}>{selectedUser.contactNumber || '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Email</div>
                                            <div style={{ fontWeight: 600 }}>{selectedUser.user?.email || selectedUser.emailAddress || '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Gender</div>
                                            <div style={{ fontWeight: 600 }}>{selectedUser.gender || '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Date of Birth</div>
                                            <div style={{ fontWeight: 600 }}>{selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>LinkedIn</div>
                                            <div style={{ fontWeight: 600 }}>
                                                {selectedUser.linkedinUrl ? <a href={selectedUser.linkedinUrl} target="_blank" rel="noreferrer" style={{color: 'var(--primary)'}}>View Profile</a> : '—'}
                                            </div>
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Address</div>
                                            <div style={{ fontWeight: 600 }}>
                                                {selectedUser.address ? `${selectedUser.address.city || ''}, ${selectedUser.address.state || ''}, ${selectedUser.address.country || ''}`.replace(/(^[,\s]+)|([,\s]+$)/g, '') : '—'}
                                            </div>
                                        </div>
                                        
                                        {/* Education */}
                                        <div style={{ gridColumn: 'span 2', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Education Details</div>
                                            <div className="grid-2" style={{ gap: 12 }}>
                                                <div>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Degree & Branch</div>
                                                    <div style={{ fontWeight: 600 }}>{selectedUser.education?.degree ? `${selectedUser.education.degree} in ${selectedUser.education.branch}` : '—'}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>College</div>
                                                    <div style={{ fontWeight: 600 }}>{selectedUser.education?.collegeName || '—'}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Timeline & Status</div>
                                                    <div style={{ fontWeight: 600 }}>
                                                        {selectedUser.education?.startYear ? `${selectedUser.education.startYear} - ${selectedUser.education.endYear || 'Present'} (${selectedUser.education.status || 'Pursuing'})` : '—'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Academic Scores</div>
                                                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                                                        CGPA: {selectedUser.education?.cgpa || '—'} • 12th: {selectedUser.education?.twelfthPercentage ? `${selectedUser.education.twelfthPercentage}%` : '—'} • 10th: {selectedUser.education?.tenthPercentage ? `${selectedUser.education.tenthPercentage}%` : '—'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Skills */}
                                        <div style={{ gridColumn: 'span 2', marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                                            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Skills & Tools</div>
                                            <div className="grid-2" style={{ gap: 12 }}>
                                                <div>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Technical</div>
                                                    <div style={{ fontWeight: 600 }}>{selectedUser.skills?.technical?.join(', ') || '—'}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Tools</div>
                                                    <div style={{ fontWeight: 600 }}>{selectedUser.skills?.tools?.join(', ') || '—'}</div>
                                                </div>
                                                <div style={{ gridColumn: 'span 2' }}>
                                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Soft Skills</div>
                                                    <div style={{ fontWeight: 600 }}>{selectedUser.skills?.soft?.join(', ') || '—'}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Documents</div>
                                            {selectedUser.resumeUrl ? (
                                                <a href={selectedUser.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">View Resume</a>
                                            ) : <span style={{ color: 'var(--text-muted)' }}>No resume uploaded</span>}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Company</div>
                                            <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedUser.companyName || '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Industry</div>
                                            <div style={{ fontWeight: 600 }}>{selectedUser.industry || '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>HR Contact</div>
                                            <div style={{ fontWeight: 600 }}>{selectedUser.hrContactName || '—'}</div>
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Email</div>
                                            <div style={{ fontWeight: 600 }}>{selectedUser.user?.email}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Phone</div>
                                            <div style={{ fontWeight: 600 }}>{selectedUser.phoneNumber || '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Website</div>
                                            <div style={{ fontWeight: 600 }}>{selectedUser.websiteUrl || '—'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>GST Number</div>
                                            <div style={{ fontWeight: 600 }}>{selectedUser.gstNumber || '—'}</div>
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Address</div>
                                            <div style={{ fontWeight: 600 }}>{selectedUser.address || '—'}</div>
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Description</div>
                                            <div style={{ fontWeight: 600 }}>{selectedUser.description || '—'}</div>
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Documents</div>
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                {selectedUser.registrationDocument ? (
                                                    <a href={selectedUser.registrationDocument} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">View Registration</a>
                                                ) : <span style={{ color: 'var(--text-muted)' }}>No registration uploaded</span>}
                                                {selectedUser.companyLogo && (
                                                    <a href={selectedUser.companyLogo} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">View Logo</a>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={() => setSelectedUser(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                            <button onClick={() => rejectProfile(selectedUser._id, selectedUser.roleType)} className="btn btn-danger" style={{ flex: 1 }}>Reject</button>
                            <button onClick={() => approveProfile(selectedUser._id, selectedUser.roleType)} className="btn btn-success" style={{ flex: 1 }}>Approve</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── JOB APPROVAL MODAL ── */}
            {jobToApprove && (
                <div className="modal-overlay animate-fade-in" onClick={() => setJobToApprove(null)}>
                    <div className="modal-card animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <div className="modal-header">
                            <div className="modal-title">Approve Job Posting</div>
                            <div className="modal-subtitle">Configure visibility and remarks for {jobToApprove.title}</div>
                        </div>

                        <div className="modal-body" style={{ padding: 24 }}>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-main)' }}>Display Visibility</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <button
                                        className={`btn ${approvalData.visibility === 'All' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setApprovalData(d => ({ ...d, visibility: 'All' }))}
                                        style={{ fontSize: 12 }}
                                    >
                                        Display to All Students
                                    </button>
                                    <button
                                        className={`btn ${approvalData.visibility === 'Current Only' ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setApprovalData(d => ({ ...d, visibility: 'Current Only' }))}
                                        style={{ fontSize: 12 }}
                                    >
                                        Current Students Only
                                    </button>
                                </div>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                                    {approvalData.visibility === 'Current Only'
                                        ? `Visible only to students graduating in ${new Date().getFullYear() + 1}`
                                        : 'Visible to students of all batches (Past and Current)'}
                                </p>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-main)' }}>Remarks (Optional)</label>
                                <textarea
                                    className="auth-input-field"
                                    style={{ width: '100%', minHeight: 80, padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}
                                    placeholder="Add any instructions or notes for the company..."
                                    value={approvalData.remarks}
                                    onChange={e => setApprovalData(d => ({ ...d, remarks: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, padding: '0 24px 24px' }}>
                            <button onClick={() => setJobToApprove(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                            <button onClick={submitApproval} className="btn btn-success" style={{ flex: 1 }}>Live & Approve</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── APPLICATION HISTORY MODAL ── */}
            {selectedApplication && (
                <div className="modal-overlay animate-fade-in" onClick={() => setSelectedApplication(null)}>
                    <div className="modal-card animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <div className="modal-title">Application History</div>
                            <div className="modal-subtitle">
                                Tracking timeline for {selectedApplication.studentName} at {selectedApplication.appliedCompanyName}
                            </div>
                        </div>

                        <div className="modal-body" style={{ padding: '0 24px 24px' }}>
                            <div style={{ background: 'var(--bg)', borderRadius: 'var(--r-lg)', padding: 16, marginBottom: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Job Role</div>
                                        <div style={{ fontWeight: 600 }}>{selectedApplication.jobRole}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Current Status</div>
                                        <div>
                                            <span className={`badge ${selectedApplication.status === 'Selected' ? 'badge-success' :
                                                    selectedApplication.status === 'Rejected' ? 'badge-danger' :
                                                        selectedApplication.status === 'Applied' ? 'badge-blue' : 'badge-warning'
                                                }`}>
                                                {selectedApplication.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-main)' }}>Timeline</h4>

                            <div style={{ position: 'relative', paddingLeft: 20 }}>
                                <div style={{ position: 'absolute', left: 5, top: 10, bottom: 10, width: 2, background: 'var(--border)' }}></div>

                                <div style={{ position: 'relative', marginBottom: 20 }}>
                                    <div style={{ position: 'absolute', left: -21, top: 4, width: 12, height: 12, borderRadius: '50%', background: 'var(--blue)', border: '2px solid white', boxShadow: '0 0 0 1px var(--blue)' }}></div>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>Applied</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(selectedApplication.applicationDate).toLocaleString()}</div>
                                </div>

                                {selectedApplication.auditLog && selectedApplication.auditLog.map((log, index) => (
                                    <div key={index} style={{ position: 'relative', marginBottom: 20 }}>
                                        <div style={{ position: 'absolute', left: -21, top: 4, width: 12, height: 12, borderRadius: '50%', background: log.status === 'Selected' ? 'var(--success)' : log.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)', border: '2px solid white', boxShadow: '0 0 0 1px var(--border)' }}></div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>Status updated to {log.status}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(log.changedAt).toLocaleString()}</div>
                                        {log.remarks && (
                                            <div style={{ fontSize: 13, marginTop: 4, padding: '8px 12px', background: 'var(--bg)', borderRadius: 6, fontStyle: 'italic' }}>
                                                "{log.remarks}"
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 24px 24px' }}>
                            <button onClick={() => setSelectedApplication(null)} className="btn btn-outline">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
