import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import {
    LogOut, Building2, PlusCircle, Briefcase, Users,
    BarChart3, Bell, AlertCircle, CheckCircle, Globe,
    Mail, Phone, TrendingUp, FileText, XCircle, Clock
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
    { key: 'listings', label: 'My Job Listings', icon: Briefcase },
    { key: 'applicants', label: 'Applicants', icon: Users },
];

const CompanyDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [activeNav, setActiveNav] = useState('overview');
    const [profile, setProfile] = useState({ companyName: '', industry: '', websiteUrl: '', hrContactName: '', hrContactEmail: '', hrContactNumber: '', description: '', isLocked: false, editRequestStatus: 'None' });
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

    useEffect(() => { fetchProfile(); fetchJobs(); }, []);

    const fetchProfile = async () => {
        try { 
            const r = await api.get('/company/profile'); 
            if (r.data) setProfile({ ...r.data }); 
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
        try { const r = await api.get(`/company/jobs/${jobId}/applicants`); setApplicants(r.data); setActiveNav('applicants'); } catch (e) {}
    };

    const updateProfile = async (e) => {
        e.preventDefault();
        try { await api.put('/company/profile', profile); setMsg({ type: 'success', text: 'Profile updated!' }); fetchProfile(); }
        catch (err) { setMsg({ type: 'error', text: err.response?.data?.error || 'Update failed' }); }
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

    const updateApplicantStatus = async (appId, status) => {
        try { await api.patch(`/company/applications/${appId}/status`, { status }); fetchApplicants(selectedJob); }
        catch (e) { setMsg({ type: 'error', text: 'Failed to update status' }); }
    };

    const isLocked = profile.isLocked && profile.editRequestStatus !== 'Approved';
    const initials = profile.companyName ? profile.companyName.slice(0, 2).toUpperCase() : 'CO';

    /* Chart data */
    const statusCounts = jobs.reduce((acc, j) => { acc[j.status] = (acc[j.status] || 0) + 1; return acc; }, {});
    const jobStatusPie = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    const applicantsPerJob = jobs.slice(0, 8).map(j => ({ title: j.title?.slice(0, 15) + (j.title?.length > 15 ? '…' : ''), applications: j.applicationCount || 0 }));

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
                        <div className={`navbar-status badge ${user.isVerified ? 'badge-success' : 'badge-warning'}`}>
                            <span className="badge-dot"></span>
                            {user.isVerified ? 'Verified Company' : 'Pending Approval'}
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
                    {!user.isVerified && (activeNav === 'post' || activeNav === 'listings' || activeNav === 'applicants') && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
                            <div className="card animate-scale-in" style={{ maxWidth: 400, textAlign: 'center', padding: '48px 40px' }}>
                                <div style={{ width: 60, height: 60, background: 'var(--warning-soft)', borderRadius: 'var(--r-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <AlertCircle size={30} color="var(--warning)" />
                                </div>
                                <h2 style={{ fontSize: 18, marginBottom: 10 }}>Pending Approval</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>Your company account is awaiting admin verification. Complete your company profile to expedite this process.</p>
                                <button className="btn btn-primary btn-full" onClick={() => setActiveNav('profile')}>Complete Profile →</button>
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
                                                <XAxis dataKey="title" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Bar dataKey="applications" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Applications" />
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
                                                    <select className="form-select" value={profile.industry || ''} onChange={e => setProfile({ ...profile, industry: e.target.value })} disabled={isLocked}>
                                                        <option value="">Select...</option>
                                                        <option value="Technology">Technology</option>
                                                        <option value="Finance">Finance & Banking</option>
                                                        <option value="Healthcare">Healthcare</option>
                                                        <option value="Education">Education</option>
                                                        <option value="Manufacturing">Manufacturing</option>
                                                        <option value="Consulting">Consulting</option>
                                                        <option value="E-commerce">E-commerce</option>
                                                    </select>
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
                                                            <input className="form-control" value={profile.hrContactNumber || ''} onChange={e => setProfile({ ...profile, hrContactNumber: e.target.value })} disabled={isLocked} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ paddingTop: 20, marginTop: 20, borderTop: '1px solid var(--border)' }}>
                                            <button type="submit" className="btn btn-primary" disabled={isLocked}>Save Changes</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* ── POST JOB ── */}
                        {activeNav === 'post' && user.isVerified && (
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
                                                    <label className="form-label">Required Skills (Comma separated)</label>
                                                    <input className="form-control" value={new_job.requiredSkills} onChange={e => setNewJob({ ...new_job, requiredSkills: e.target.value })} placeholder="React, Node.js, Python" />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Eligible Branches (CSV)</label>
                                                    <input className="form-control" value={new_job.eligibleBranches} onChange={e => setNewJob({ ...new_job, eligibleBranches: e.target.value })} placeholder="Computer Engineering, IT" />
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
                        {activeNav === 'listings' && user.isVerified && (
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

                        {/* ── APPLICANTS ── */}
                        {activeNav === 'applicants' && user.isVerified && (
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
                                                        {app.student?.resumeUrl
                                                            ? <a href={app.student.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">CV</a>
                                                            : '—'}
                                                    </td>
                                                    <td>
                                                        <select className="form-select" style={{ height: 32, fontSize: 11 }} value={app.status} onChange={e => updateApplicantStatus(app._id, e.target.value)}>
                                                            {STATUS_SELECT.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                                        </select>
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
        </div>
    );
};

export default CompanyDashboard;
