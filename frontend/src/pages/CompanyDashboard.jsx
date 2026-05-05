import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import {
    LogOut, Building2, PlusCircle, Briefcase, Users,
    BarChart3, Bell, AlertCircle, CheckCircle, Globe,
    Mail, Phone, TrendingUp, FileText, XCircle, Clock, Search, Filter
} from 'lucide-react';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line
} from 'recharts';


const COLORS = ['#4F46E5', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'white', border: '1px solid #E8EAF0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            {label && <p style={{ fontWeight: 700, fontSize: 12, color: '#111827', marginBottom: 6 }}>{label}</p>}
            {payload.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4B5563' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color || p.fill }}></div>
                    <span>{p.name}: <strong style={{ color: '#111827' }}>{p.value}</strong></span>
                </div>
            ))}
        </div>
    );
};

const STATUS_SELECT = [
    { value: 'Applied', label: 'Applied', class: 'badge-blue' },
    { value: 'Shortlisted', label: 'Shortlisted', class: 'badge-warning' },
    { value: 'Interview Scheduled', label: 'Interview Scheduled', class: 'badge-purple' },
    { value: 'Selected', label: 'Selected', class: 'badge-success' },
    { value: 'Rejected', label: 'Rejected', class: 'badge-danger' },
];

const NAV = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'profile', label: 'Company Profile', icon: Building2 },
    { key: 'post', label: 'Post a Job', icon: PlusCircle },
    { key: 'listings', label: 'Job-wise Tracking', icon: Briefcase },
    { key: 'all-applicants', label: 'Applicant Management', icon: Users },
];

const CompanyDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [activeNav, setActiveNav] = useState('overview');
    const [profile, setProfile] = useState({
        companyName: '', industry: '', websiteUrl: '', hrContactName: '', hrContactEmail: '', hrContactNumber: '',
        description: '', phoneNumber: '', address: '', isRegistered: false,
        registrationDocument: '', companyLogo: '',
        isLocked: false, editRequestStatus: 'None', status: '', rejectionReason: ''
    });
    const [jobs, setJobs] = useState([]);
    const [applicants, setApplicants] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [new_job, setNewJob] = useState({
        title: '',
        package: '',
        location: '',
        description: '',
        requiredSkills: '',
        requiredStudents: 1,
        appStartDate: '',
        appCloseDate: '',
        minCGPA: '',
        eligibleBranches: ''
    });

    const [allApplicants, setAllApplicants] = useState([]);
    const [applicantSearchTerm, setApplicantSearchTerm] = useState('');
    const [applicantStatusFilter, setApplicantStatusFilter] = useState('All');
    const [applicantJobFilter, setApplicantJobFilter] = useState('All');
    const [selectedStudent, setSelectedStudent] = useState(null);

    useEffect(() => { fetchProfile(); fetchJobs(); }, []);

    useEffect(() => {
        if (activeNav === 'all-applicants') fetchAllApplicants();
    }, [activeNav]);

    const fetchProfile = async () => {
        try {
            const r = await api.get('/company/profile');
            if (r.data) {
                setProfile({ ...r.data });
                if (!r.data.isProfileComplete && r.data.status !== 'Approved') {
                    setActiveNav('profile');
                    setMsg({ type: 'warning', text: 'First Complete profile' });
                }
            }
        } catch (e) {
            console.error('Fetch Profile Error:', e);
        }
    };

    const fetchJobs = async () => {
        try {
            const r = await api.get('/company/jobs');
            setJobs(r.data);
        } catch (e) {
            console.error('Fetch Jobs Error:', e);
            const errMsg = e.response?.data?.error || 'Failed to load job listings. Please refresh.';
            setMsg({ type: 'error', text: errMsg });
        }
    };

    const fetchApplicants = async (jobId) => {
        setSelectedJob(jobId);
        try { const r = await api.get(`/company/jobs/${jobId}/applicants`); setApplicants(r.data); setActiveNav('applicants'); } catch (e) { }
    };

    const fetchAllApplicants = async () => {
        try {
            const r = await api.get('/company/applicants');
            setAllApplicants(r.data);
        } catch (e) {
            console.error('Fetch All Applicants Error:', e);
        }
    };

    const updateProfile = async (e) => {
        e.preventDefault();

        // ── Validation: Check if all profile fields are full! ──
        const reqFields = [
            { key: 'companyName', label: 'Company Name' },
            { key: 'industry', label: 'Industry' },
            { key: 'websiteUrl', label: 'Website URL' },
            { key: 'description', label: 'About Company' },
            { key: 'hrContactName', label: 'HR Name' },
            { key: 'hrContactEmail', label: 'HR Email' },
            { key: 'hrContactNumber', label: 'HR Phone' }
        ];

        for (let field of reqFields) {
            if (!profile[field.key] || profile[field.key].toString().trim() === '') {
                setMsg({ type: 'error', text: `Please fill out your ${field.label}` });
                return;
            }
        }

        if (profile.hrContactNumber && !/^[789]\d{9}$/.test(profile.hrContactNumber)) {
            setMsg({ type: 'error', text: 'HR Phone must be exactly 10 digits and start with 7, 8, or 9' });
            return;
        }

        if (profile.isRegistered && !profile.registrationDocument) {
            setMsg({ type: 'error', text: 'Please provide a drive link for your Registration Document.' });
            return;
        }

        try { await api.put('/company/profile', profile); setMsg({ type: 'success', text: 'Profile saved!' }); fetchProfile(); }
        catch (err) { setMsg({ type: 'error', text: err.response?.data?.error || 'Update failed' }); }
    };

    const handleSubmitForApproval = async () => {
        // Validation checks
        const reqFields = [
            { key: 'companyName', label: 'Company Name' },
            { key: 'industry', label: 'Industry' },
            { key: 'websiteUrl', label: 'Website URL' },
            { key: 'description', label: 'About Company' },
            { key: 'hrContactName', label: 'HR Name' },
            { key: 'hrContactEmail', label: 'HR Email' },
            { key: 'hrContactNumber', label: 'HR Phone' }
        ];

        for (let field of reqFields) {
            if (!profile[field.key] || profile[field.key].toString().trim() === '') {
                setMsg({ type: 'error', text: `Please fill out your ${field.label}` });
                return;
            }
        }

        if (profile.hrContactNumber && !/^[789]\d{9}$/.test(profile.hrContactNumber)) {
            setMsg({ type: 'error', text: 'HR Phone must be exactly 10 digits and start with 7, 8, or 9' });
            return;
        }

        if (profile.isRegistered && !profile.registrationDocument) {
            setMsg({ type: 'error', text: 'Please provide a drive link for your Registration Document.' });
            return;
        }

        try {
            await api.put('/company/profile', profile); // Auto-save first
            await api.post('/company/submit-profile');
            setMsg({ type: 'success', text: 'your profile request sent to admin approval' });
            fetchProfile();
        } catch (err) { setMsg({ type: 'error', text: err.response?.data?.error || 'Submission failed' }); }
    };

    const handleFileUpload = async (e, type) => {
        if (!e.target.files[0]) return;
        const fd = new FormData();
        const endpoint = type === 'logo' ? '/company/upload-logo' : '/company/upload-registration';
        fd.append(type === 'logo' ? 'logo' : 'registration', e.target.files[0]);
        try {
            const { data } = await api.post(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (type === 'logo') {
                setProfile({ ...profile, companyLogo: data.url });
            } else {
                setProfile({ ...profile, registrationDocument: data.url });
            }
            setMsg({ type: 'success', text: `${type === 'logo' ? 'Logo' : 'Document'} uploaded successfully!` });
        } catch (err) {
            setMsg({ type: 'error', text: `Failed to upload ${type}` });
        }
    };

    const requestEdit = async () => {
        try { await api.post('/company/request-edit'); setMsg({ type: 'success', text: 'Edit request sent to admin.' }); fetchProfile(); }
        catch (err) { setMsg({ type: 'error', text: err.response?.data?.error || 'Failed' }); }
    };

    const postJob = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...new_job,
                package: parseFloat(new_job.package) || 0,
                minCGPA: parseFloat(new_job.minCGPA) || 0,
                eligibleBranches: new_job.eligibleBranches.split(',').map(s => s.trim()).filter(s => s),
                requiredSkills: new_job.requiredSkills.split(',').map(s => s.trim()).filter(s => s)
            };
            await api.post('/company/jobs', payload);
            setMsg({ type: 'success', text: 'Job posted successfully!' });
            setNewJob({
                title: '', package: '', location: '', description: '',
                requiredSkills: '', requiredStudents: 1, appStartDate: '', appCloseDate: '',
                minCGPA: '', eligibleBranches: ''
            });
            setActiveNav('listings'); fetchJobs();
        } catch (err) { setMsg({ type: 'error', text: err.response?.data?.error || 'Failed' }); }
    };

    const updateApplicantStatus = async (appId, status, isGlobal = false) => {
        try {
            await api.patch(`/company/applications/${appId}/status`, { status });
            if (isGlobal) {
                fetchAllApplicants();
            } else {
                fetchApplicants(selectedJob);
            }
        }
        catch (e) { setMsg({ type: 'error', text: 'Failed to update status. Invalid transition or server error.' }); }
    };

    const renderStatusSelect = (app, isGlobal = false) => {
        const transitions = {
            'Applied': ['Applied', 'Shortlisted', 'Rejected'],
            'Shortlisted': ['Shortlisted', 'Interview Scheduled', 'Rejected'],
            'Interview Scheduled': ['Interview Scheduled', 'Selected', 'Rejected'],
            'Selected': ['Selected'],
            'Rejected': ['Rejected']
        };
        const validStatuses = transitions[app.status] || [app.status];

        return (
            <select
                className="form-select"
                style={{ height: 32, fontSize: 11 }}
                value={app.status}
                onChange={e => updateApplicantStatus(app._id, e.target.value, isGlobal)}
                disabled={app.status === 'Selected' || app.status === 'Rejected'}
            >
                {STATUS_SELECT.map(s => (
                    <option key={s.value} value={s.value} disabled={!validStatuses.includes(s.value)}>{s.label}</option>
                ))}
            </select>
        );
    };

    const isLocked = profile.isLocked && profile.editRequestStatus !== 'Approved';
    const initials = profile.companyName ? profile.companyName.slice(0, 2).toUpperCase() : 'CO';

    /* Chart data */
    const statusCounts = jobs.reduce((acc, j) => { acc[j.status] = (acc[j.status] || 0) + 1; return acc; }, {});
    const jobStatusPie = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    const applicantsPerJob = jobs.slice(0, 8).map(j => ({ title: j.title?.slice(0, 15) + (j.title?.length > 15 ? '…' : ''), applications: j.applicationCount || 0 }));

    // Filters for All Applicants
    const filteredAllApplicants = allApplicants.filter(app => {
        const searchStr = applicantSearchTerm.toLowerCase();
        const matchesSearch = (app.student?.name || '').toLowerCase().includes(searchStr) ||
            (app.student?.skills?.technical || []).some(s => s.toLowerCase().includes(searchStr)) ||
            (app.student?.skills?.soft || []).some(s => s.toLowerCase().includes(searchStr));

        const matchesStatus = applicantStatusFilter === 'All' || app.status === applicantStatusFilter;
        const matchesJob = applicantJobFilter === 'All' || app.job?._id === applicantJobFilter;

        return matchesSearch && matchesStatus && matchesJob;
    });

    return (
        <div className="app-layout">
            {/* ── SIDEBAR ── */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon" style={{ background: 'var(--purple)' }}>
                        <Building2 size={20} color="white" />
                    </div>
                    <div>
                        <div className="sidebar-logo-text">PlacePortal</div>
                        <span className="sidebar-logo-sub">Recruiter</span>
                    </div>
                </div>

                <div className="sidebar-body">
                    <span className="sidebar-section-label">Navigation</span>
                    {NAV.map(item => {
                        const Icon = item.icon;
                        return (
                            <button key={item.key} className={`sidebar-link ${activeNav === item.key ? 'active' : ''}`} onClick={() => setActiveNav(item.key)}>
                                <Icon size={17} />
                                <span>{item.label}</span>
                                {item.key === 'listings' && jobs.length > 0 && (
                                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>{jobs.length}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="sidebar-footer">
                    <div className="sidebar-user" onClick={logout} title="Sign out" style={{ cursor: 'pointer' }}>
                        <div className="sidebar-user-avatar" style={{ background: 'var(--purple-soft)', color: 'var(--purple)', fontSize: 13, fontWeight: 800 }}>{initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.companyName || 'Company'}</div>
                            <div className="sidebar-user-role">Click to sign out</div>
                        </div>
                        <LogOut size={15} color="var(--text-muted)" />
                    </div>
                </div>
            </aside>

            {/* ── MAIN ── */}
            <div className="main-wrapper">
                <nav className="navbar">
                    <div className="navbar-left">
                        <div>
                            <div className="navbar-page-title">{NAV.find(n => n.key === activeNav)?.label || 'Dashboard'}</div>
                            <div className="navbar-breadcrumb">PlacePortal / Recruiter / {activeNav}</div>
                        </div>
                    </div>
                    <div className="navbar-right">
                        <div className={`navbar-status badge ${profile.status === 'Approved' ? 'badge-success' : profile.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                            <span className="badge-dot"></span>
                            {profile.status || 'Draft'}
                        </div>
                        <button className="navbar-icon-btn"><Bell size={16} /></button>
                        <div className="navbar-profile">
                            <div className="navbar-profile-avatar" style={{ background: 'var(--purple-soft)', color: 'var(--purple)', fontWeight: 800 }}>{initials}</div>
                            <div>
                                <div className="navbar-profile-name">{profile.companyName || 'Company'}</div>
                                <div className="navbar-profile-role">{user.email}</div>
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="page-content">
                    {/* Unverified notice */}
                    {profile.status !== 'Approved' && (activeNav === 'post' || activeNav === 'listings' || activeNav === 'applicants' || activeNav === 'all-applicants') && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
                            <div className="card animate-scale-in" style={{ maxWidth: 400, textAlign: 'center', padding: '48px 40px' }}>
                                <div style={{ width: 60, height: 60, background: 'var(--warning-soft)', borderRadius: 'var(--r-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <AlertCircle size={30} color="var(--warning)" />
                                </div>
                                <h2 style={{ fontSize: 18, marginBottom: 10 }}>Pending Approval</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>Your company profile needs to be approved by the admin. Complete your company profile to expedite this process.</p>
                                <button className="btn btn-primary btn-full" onClick={() => setActiveNav('profile')}>Go to Profile →</button>
                            </div>
                        </div>
                    )}

                    {msg.text && <div className={`alert alert-${msg.type}`}><AlertCircle size={16} />{msg.text}</div>}

                    <div className="animate-fade-up">

                        {/* ── OVERVIEW ── */}
                        {activeNav === 'overview' && (
                            <>
                                {/* Banner */}
                                <div style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)', borderRadius: 'var(--r-2xl)', padding: '28px 32px', marginBottom: 24, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ opacity: 0.8, fontSize: 13, marginBottom: 4 }}>Welcome back 👋</p>
                                        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 6 }}>{profile.companyName || 'Your Company'}</h1>
                                        <p style={{ opacity: 0.8, fontSize: 13 }}>{jobs.length} job posting{jobs.length !== 1 ? 's' : ''} · {profile.industry || 'No industry set'}</p>
                                    </div>
                                    <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--r-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: 'white', flexShrink: 0 }}>{initials}</div>
                                </div>

                                <div className="stat-grid stagger" style={{ marginBottom: 24 }}>
                                    {[
                                        { label: 'Total Job Posts', value: jobs.length, icon: Briefcase, color: '#4F46E5', soft: '#EEF2FF' },
                                        { label: 'Open Jobs', value: jobs.filter(j => j.status === 'Open').length, icon: CheckCircle, color: '#059669', soft: '#ECFDF5' },
                                        { label: 'Upcoming', value: jobs.filter(j => j.status === 'Upcoming').length, icon: Clock, color: '#D97706', soft: '#FFFBEB' },
                                        { label: 'Total Applicants', value: jobs.reduce((s, j) => s + (j.applicationCount || 0), 0), icon: Users, color: '#7C3AED', soft: '#F5F3FF' },
                                    ].map((card, i) => {
                                        const Icon = card.icon;
                                        return (
                                            <div key={i} className="stat-card animate-fade-up" style={{ '--stat-color': card.color, '--stat-soft': card.soft, animationDelay: `${i * 0.07}s` }}>
                                                <div className="stat-card-top">
                                                    <div className="stat-card-icon"><Icon size={20} /></div>
                                                </div>
                                                <div className="stat-card-value">{card.value}</div>
                                                <div className="stat-card-label">{card.label}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
                                    <div className="chart-card">
                                        <div className="card-header"><div className="card-title">Applications per Job</div></div>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={applicantsPerJob}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF0" vertical={false} />
                                                <XAxis dataKey="title" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                                                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false} axisLine={false} tickLine={false} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="applications" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Applications" maxBarSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="chart-card">
                                        <div className="card-title" style={{ marginBottom: 16 }}>Job Status</div>
                                        {jobs.length > 0 ? (
                                            <>
                                                <ResponsiveContainer width="100%" height={140}>
                                                    <PieChart>
                                                        <Pie data={jobStatusPie} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                                                            {jobStatusPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip content={<CustomTooltip />} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                {jobStatusPie.map((d, i) => (
                                                    <div key={i} className="metric-row" style={{ fontSize: 12 }}>
                                                        <div className="legend-item">
                                                            <div className="legend-dot" style={{ background: COLORS[i % COLORS.length] }}></div>
                                                            <span className="metric-label">{d.name}</span>
                                                        </div>
                                                        <span className="metric-value">{d.value}</span>
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="empty-state"><div className="empty-state-icon" style={{ margin: '0 auto 12px' }}><Briefcase size={22} /></div><p>No jobs posted yet</p></div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── COMPANY PROFILE ── */}
                        {activeNav === 'profile' && (
                            <div style={{ maxWidth: 720 }}>
                                <div className="page-header">
                                    <h1>Company Profile</h1>
                                    <p>This information will be shown to students on job listings</p>
                                </div>

                                {isLocked && (
                                    <div className="locked-banner">
                                        <AlertCircle size={18} color="var(--warning)" style={{ flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <p>Profile is locked after verification. {profile.editRequestStatus === 'None' ? 'Request permission to edit.' : 'Edit permission request pending.'}</p>
                                        </div>
                                        {profile.editRequestStatus === 'None' && (
                                            <button onClick={requestEdit} className="btn btn-sm" style={{ background: 'var(--warning)', color: 'white', border: 'none' }}>Request Edit</button>
                                        )}
                                    </div>
                                )}
                                {profile.status === 'Rejected' && (
                                    <div className="alert alert-danger" style={{ marginBottom: 20 }}>
                                        <strong>Profile Rejected:</strong> {profile.rejectionReason}
                                        <br />Please make the necessary changes and submit again.
                                    </div>
                                )}
                                {profile.status === 'Pending' && (
                                    <div className="alert alert-warning" style={{ marginBottom: 20 }}>
                                        Your profile is currently pending admin approval. You cannot make edits at this time.
                                    </div>
                                )}

                                <div className="card">
                                    <form onSubmit={updateProfile}>
                                        <div className="card-header">
                                            <div className="card-title">Company Details</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            <div className="grid-2" style={{ gap: 16 }}>
                                                <div className="form-group">
                                                    <label className="form-label">Company Name</label>
                                                    <div className="input-group">
                                                        <div className="input-group-icon"><Building2 size={16} /></div>
                                                        <input className="form-control" value={profile.companyName || ''} onChange={e => setProfile({ ...profile, companyName: e.target.value })} disabled={isLocked} required />
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Industry</label>
                                                    <input type="text" className="form-control" value={profile.industry || ''} onChange={e => setProfile({ ...profile, industry: e.target.value })} disabled={isLocked} placeholder="e.g. Technology, Finance, etc." />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Website URL</label>
                                                <div className="input-group">
                                                    <div className="input-group-icon"><Globe size={16} /></div>
                                                    <input type="url" className="form-control" value={profile.websiteUrl || ''} onChange={e => setProfile({ ...profile, websiteUrl: e.target.value })} disabled={isLocked} placeholder="https://company.com" />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">About Company</label>
                                                <textarea className="form-textarea" rows={3} value={profile.description || ''} onChange={e => setProfile({ ...profile, description: e.target.value })} disabled={isLocked} placeholder="Brief company description..." />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">Phone Number (Company)</label>
                                                <div className="input-group">
                                                    <div className="input-group-icon"><Phone size={16} /></div>
                                                    <input className="form-control" value={profile.phoneNumber || ''} onChange={e => setProfile({ ...profile, phoneNumber: e.target.value })} disabled={isLocked} />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Full Address</label>
                                                <textarea className="form-textarea" rows={2} value={profile.address || ''} onChange={e => setProfile({ ...profile, address: e.target.value })} disabled={isLocked} />
                                            </div>

                                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                                                <div className="form-group">
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                                                        <input type="checkbox" checked={profile.isRegistered} onChange={e => setProfile({ ...profile, isRegistered: e.target.checked })} disabled={isLocked} style={{ width: 16, height: 16 }} />
                                                        Is this company registered?
                                                    </label>
                                                </div>
                                                {profile.isRegistered && (
                                                    <div className="form-group">
                                                        <label className="form-label">Registration Certificate (Drive Link) <span style={{ color: 'var(--danger)' }}>*</span></label>
                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                            <input 
                                                                type="url" 
                                                                className="form-control" 
                                                                value={profile.registrationDocument || ''} 
                                                                onChange={e => setProfile({ ...profile, registrationDocument: e.target.value })} 
                                                                disabled={isLocked} 
                                                                placeholder="https://drive.google.com/..." 
                                                                required={profile.isRegistered}
                                                            />
                                                            {profile.registrationDocument && <a href={profile.registrationDocument} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">Test Link</a>}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="form-group">
                                                    <label className="form-label">Company Logo (Image)</label>
                                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                        {profile.companyLogo && <img src={profile.companyLogo} alt="Logo" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />}
                                                        <input type="file" className="form-control" onChange={e => handleFileUpload(e, 'logo')} disabled={isLocked} accept=".png,.jpg,.jpeg" style={{ padding: '8px' }} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 14 }}>HR Contact</div>
                                                <div className="grid-2" style={{ gap: 16 }}>
                                                    <div className="form-group">
                                                        <label className="form-label">HR Name</label>
                                                        <input className="form-control" value={profile.hrContactName || ''} onChange={e => setProfile({ ...profile, hrContactName: e.target.value })} disabled={isLocked} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">HR Email</label>
                                                        <div className="input-group">
                                                            <div className="input-group-icon"><Mail size={16} /></div>
                                                            <input type="email" className="form-control" value={profile.hrContactEmail || ''} onChange={e => setProfile({ ...profile, hrContactEmail: e.target.value })} disabled={isLocked} />
                                                        </div>
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">HR Phone</label>
                                                        <div className="input-group">
                                                            <div className="input-group-icon"><Phone size={16} /></div>
                                                            <input className="form-control" maxLength="10" placeholder="e.g. 9876543210" value={profile.hrContactNumber || ''} onChange={e => setProfile({ ...profile, hrContactNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })} disabled={isLocked} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ paddingTop: 20, marginTop: 20, borderTop: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <button type="submit" className="btn btn-outline" disabled={isLocked || profile.status === 'Pending'}>Save Draft</button>
                                                <button type="button" onClick={handleSubmitForApproval} className="btn btn-primary" disabled={isLocked || profile.status === 'Pending'}>Submit for Approval</button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* ── POST JOB ── */}
                        {activeNav === 'post' && profile.status === 'Approved' && (
                            <div style={{ maxWidth: 720 }}>
                                <div className="page-header">
                                    <h1>Post a Job</h1>
                                    <p>Specify application dates and required student count</p>
                                </div>
                                <div className="card">
                                    <form onSubmit={postJob}>
                                        <div className="card-header"><div className="card-title">Job Details</div></div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            <div className="form-group">
                                                <label className="form-label">Job Title</label>
                                                <input className="form-control" required value={new_job.title} onChange={e => setNewJob({ ...new_job, title: e.target.value })} placeholder="Software Engineer" />
                                            </div>
                                            <div className="grid-2" style={{ gap: 16 }}>
                                                <div className="form-group">
                                                    <label className="form-label">Package (LPA)</label>
                                                    <input type="number" className="form-control" step="0.01" value={new_job.package} onChange={e => setNewJob({ ...new_job, package: e.target.value })} placeholder="e.g. 12" required />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Location</label>
                                                    <input className="form-control" value={new_job.location} onChange={e => setNewJob({ ...new_job, location: e.target.value })} placeholder="e.g. Remote, Bangalore" required />
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Required Students (Limit)</label>
                                                <input type="number" className="form-control" value={new_job.requiredStudents} onChange={e => setNewJob({ ...new_job, requiredStudents: parseInt(e.target.value) || 1 })} min="1" />
                                            </div>
                                            <div className="grid-2" style={{ gap: 16 }}>
                                                <div className="form-group">
                                                    <label className="form-label">Required Skills</label>
                                                    <input className="form-control" value={new_job.requiredSkills} onChange={e => setNewJob({ ...new_job, requiredSkills: e.target.value })} placeholder="React, Node.js, Python" />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Eligible Branches</label>
                                                    <select multiple className="form-control" style={{ minHeight: '120px' }} value={new_job.eligibleBranches ? new_job.eligibleBranches.split(',').map(s=>s.trim()) : []} onChange={e => setNewJob({ ...new_job, eligibleBranches: Array.from(e.target.selectedOptions, opt => opt.value).join(', ') })}>
                                                        <option value="B.Tech (Computer Science)">B.Tech (Computer Science)</option>
                                                        <option value="B.Tech (Information Technology)">B.Tech (Information Technology)</option>
                                                        <option value="B.E. (Computer Science)">B.E. (Computer Science)</option>
                                                        <option value="B.E. (Information Technology)">B.E. (Information Technology)</option>
                                                        <option value="BCA">BCA</option>
                                                        <option value="MCA">MCA</option>
                                                        <option value="B.Sc (Computer Science)">B.Sc (Computer Science)</option>
                                                        <option value="B.Sc (IT)">B.Sc (IT)</option>
                                                        <option value="M.Sc (IT)">M.Sc (IT)</option>
                                                        <option value="Diploma (Computer Engineering)">Diploma (Computer Engineering)</option>
                                                        <option value="Diploma (IT)">Diploma (IT)</option>
                                                    </select>
                                                    <small style={{ fontSize: 11, color: 'var(--text-muted)' }}>Hold Ctrl/Cmd to select multiple</small>
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Minimum CGPA Criteria</label>
                                                <input type="number" step="0.01" className="form-control" value={new_job.minCGPA} onChange={e => setNewJob({ ...new_job, minCGPA: e.target.value })} placeholder="e.g. 7.5" />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">Job Description</label>
                                                <textarea className="form-textarea" rows={4} value={new_job.description} onChange={e => setNewJob({ ...new_job, description: e.target.value })} placeholder="Explain roles, responsibilities, and benefits..." />
                                            </div>

                                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 14 }}>Application Timeline</div>
                                                <div className="grid-2" style={{ gap: 16 }}>
                                                    <div className="form-group">
                                                        <label className="form-label">Start Date</label>
                                                        <input type="date" className="form-control" required value={new_job.appStartDate} onChange={e => setNewJob({ ...new_job, appStartDate: e.target.value })} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Close Date</label>
                                                        <input type="date" className="form-control" required value={new_job.appCloseDate} onChange={e => setNewJob({ ...new_job, appCloseDate: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ paddingTop: 20, marginTop: 20, borderTop: '1px solid var(--border)' }}>
                                            <button type="submit" className="btn btn-primary">Post Job Listing</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* ── JOB LISTINGS ── */}
                        {activeNav === 'listings' && profile.status === 'Approved' && (
                            <>
                                <div className="page-header page-header-row">
                                    <div><h1>Job Listings</h1><p>Manage your job postings and applicants</p></div>
                                    <button className="btn btn-primary" onClick={() => setActiveNav('post')}><PlusCircle size={16} /> Post Job</button>
                                </div>
                                <div className="table-card">
                                    <table className="data-table">
                                        <thead><tr><th>Job Title</th><th>Package</th><th>CGPA</th><th>Limit</th><th>Applicants</th><th>Status</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {jobs.map(j => (
                                                <tr key={j._id}>
                                                    <td className="cell-primary">{j.title}</td>
                                                    <td>{j.package ? `${j.package} LPA` : '—'}</td>
                                                    <td>{j.criteria?.minCGPA || '—'}</td>
                                                    <td>{j.requiredStudents}</td>
                                                    <td><span className="badge badge-blue">{j.applicationCount || 0}</span></td>
                                                    <td>
                                                        <span className={`badge badge-${j.status.toLowerCase().replace(' ', '-')}`}>
                                                            <span className="badge-dot"></span>{j.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button onClick={() => fetchApplicants(j._id)} className="btn btn-primary btn-sm">
                                                            <Users size={13} /> Applicants
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {jobs.length === 0 && (
                                                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon" style={{ margin: '0 auto 12px' }}><Briefcase size={22} /></div><h3>No jobs posted yet</h3></div></td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* ── ALL APPLICANTS MANAGEMENT ── */}
                        {activeNav === 'all-applicants' && profile.status === 'Approved' && (
                            <>
                                <div className="page-header page-header-row">
                                    <div><h1>Applicant Management</h1><p>Manage applications across all your jobs</p></div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <div className="search-bar" style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '6px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', gap: 8 }}>
                                            <Search size={16} color="var(--text-muted)" />
                                            <input
                                                type="text"
                                                placeholder="Search by name or skills..."
                                                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, width: 180 }}
                                                value={applicantSearchTerm}
                                                onChange={e => setApplicantSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <select
                                            className="form-select"
                                            style={{ height: 'auto', padding: '6px 12px', width: 'auto' }}
                                            value={applicantJobFilter}
                                            onChange={e => setApplicantJobFilter(e.target.value)}
                                        >
                                            <option value="All">All Jobs</option>
                                            {jobs.map(j => (
                                                <option key={j._id} value={j._id}>{j.title}</option>
                                            ))}
                                        </select>
                                        <select
                                            className="form-select"
                                            style={{ height: 'auto', padding: '6px 12px', width: 'auto' }}
                                            value={applicantStatusFilter}
                                            onChange={e => setApplicantStatusFilter(e.target.value)}
                                        >
                                            <option value="All">All Statuses</option>
                                            {STATUS_SELECT.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="table-card">
                                    <div className="table-header"><div className="table-title">Applicants ({filteredAllApplicants.length})</div></div>
                                    <table className="data-table">
                                        <thead><tr><th>Applicant</th><th>Applied Role</th><th>Skills</th><th>Education</th><th>Resume</th><th>Date</th><th>Status</th></tr></thead>
                                        <tbody>
                                            {filteredAllApplicants.map(app => (
                                                <tr key={app._id}>
                                                    <td className="cell-primary">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div
                                                                    style={{ color: 'var(--primary)', cursor: 'pointer' }}
                                                                    onClick={() => setSelectedStudent(app.student)}
                                                                >
                                                                    {app.student?.name || '—'}
                                                                </div>
                                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{app.student?.emailAddress}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ fontWeight: 600 }}>{app.job?.title}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 150 }}>
                                                            {app.student?.skills?.technical?.slice(0, 2).map((s, i) => (
                                                                <span key={i} className="badge" style={{ fontSize: 9 }}>{s}</span>
                                                            ))}
                                                            {(app.student?.skills?.technical?.length > 2) && <span className="badge" style={{ fontSize: 9 }}>+{app.student?.skills?.technical?.length - 2}</span>}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: 12 }}>
                                                            <div>{app.student?.education?.degree} {app.student?.education?.branch}</div>
                                                            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>CGPA: {app.student?.education?.cgpa || app.student?.cgpa || '—'}</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {app.student?.resumeUrl ? (
                                                            <a href={app.student.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">CV</a>
                                                        ) : (
                                                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                                                        )}
                                                    </td>
                                                    <td style={{ fontSize: 12 }}>{new Date(app.createdAt).toLocaleDateString()}</td>
                                                    <td>{renderStatusSelect(app, true)}</td>
                                                </tr>
                                            ))}
                                            {filteredAllApplicants.length === 0 && (
                                                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon" style={{ margin: '0 auto 12px' }}><Users size={22} /></div><h3>No applicants found</h3><p>Try adjusting your search filters.</p></div></td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {/* ── APPLICANTS ── */}
                        {activeNav === 'applicants' && profile.status === 'Approved' && (
                            <>
                                <div className="page-header page-header-row">
                                    <div><h1>Candidate Applications</h1><p>{applicants.length} student{applicants.length !== 1 ? 's' : ''} applied</p></div>
                                    <button className="btn btn-outline" onClick={() => setActiveNav('listings')}>← Back</button>
                                </div>
                                <div className="table-card">
                                    <table className="data-table">
                                        <thead><tr><th>Name</th><th>Email / Phone</th><th>Skills</th><th>Resume</th><th>Status</th></tr></thead>
                                        <tbody>
                                            {applicants.map(app => (
                                                <tr key={app._id}>
                                                    <td className="cell-primary">{app.student?.name || '—'}</td>
                                                    <td style={{ fontSize: 11, lineHeight: 1.4 }}>
                                                        <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{app.student?.emailAddress || '—'}</div>
                                                        <div style={{ color: 'var(--text-muted)' }}>{app.student?.contactNumber || '—'}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                            {app.student?.skills?.technical?.slice(0, 3).map((s, i) => (
                                                                <span key={i} className="badge" style={{ fontSize: 9 }}>{s}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                            {app.student?.resumeUrl ? (
                                                                <a href={app.student.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">CV</a>
                                                            ) : (
                                                                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                                                            )}
                                                            <button className="btn btn-outline btn-sm" onClick={() => setSelectedStudent(app.student)}>Profile</button>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {renderStatusSelect(app, false)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {applicants.length === 0 && (
                                                <tr><td colSpan={5}><div className="empty-state">No candidates yet</div></td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── STUDENT PROFILE MODAL ── */}
            {selectedStudent && (
                <div className="modal-overlay animate-fade-in" onClick={() => setSelectedStudent(null)}>
                    <div className="modal-card animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <div className="modal-title">Student Profile</div>
                            <div className="modal-subtitle">Detailed view of candidate</div>
                        </div>
                        <div className="modal-body" style={{ padding: '0 24px 24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Full Name</div>
                                    <div style={{ fontWeight: 600, fontSize: 15 }}>{selectedStudent.name}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Contact Info</div>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedStudent.emailAddress}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{selectedStudent.contactNumber}</div>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Education</div>
                                    <div style={{ fontWeight: 600 }}>{selectedStudent.education?.degree || '—'} in {selectedStudent.education?.branch || '—'}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>College: {selectedStudent.education?.collegeName || '—'}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>CGPA: {selectedStudent.education?.cgpa || selectedStudent.cgpa || '—'}</div>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Skills</div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {selectedStudent.skills?.technical?.map((s, i) => (
                                            <span key={`tech-${i}`} className="badge badge-blue">{s}</span>
                                        ))}
                                        {selectedStudent.skills?.soft?.map((s, i) => (
                                            <span key={`soft-${i}`} className="badge badge-purple">{s}</span>
                                        ))}
                                        {(!selectedStudent.skills?.technical?.length && !selectedStudent.skills?.soft?.length) && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No skills listed</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 24px 24px' }}>
                            {selectedStudent.resumeUrl && (
                                <a href={selectedStudent.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ marginRight: 12 }}>View Resume</a>
                            )}
                            <button onClick={() => setSelectedStudent(null)} className="btn btn-outline">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyDashboard;
