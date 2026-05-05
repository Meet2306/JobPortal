import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import MockInterview from '../components/MockInterview';
import ATSEvaluationModal from '../components/ATSEvaluationModal';
import {
    LogOut, Briefcase, FileText, User, Settings, Bell, TrendingUp,
    CheckCircle2, AlertCircle, MapPin, ChevronRight, BarChart2,
    GraduationCap, Award, BookOpen, Clock, Brain, Bot
} from 'lucide-react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts';



const STATUS_COLORS = {
    Applied: '#2563EB',
    Shortlisted: '#D97706',
    'Interview Scheduled': '#7C3AED',
    Selected: '#059669',
    Rejected: '#DC2626',
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'white', border: '1px solid #E8EAF0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <p style={{ fontWeight: 700, fontSize: 12, color: '#111827', marginBottom: 6 }}>{label}</p>
            {payload.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4B5563', marginBottom: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }}></div>
                    <span>{p.name}: <strong style={{ color: '#111827' }}>{p.value}</strong></span>
                </div>
            ))}
        </div>
    );
};

const NAV = [
    { key: 'overview', label: 'Overview', icon: BarChart2 },
    { key: 'jobs', label: 'Job Openings', icon: Briefcase },
    { key: 'applications', label: 'My Applications', icon: FileText },
    { key: 'mock-interview', label: 'Mock Interview (AI)', icon: Brain },
    { key: 'resume-scanner', label: 'AI Resume Scanner', icon: Bot },
    { key: 'profile', label: 'My Profile', icon: User },
];

const StudentDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [profile, setProfile] = useState({
        name: '', contactNumber: '', profilePhoto: '', gender: '', dateOfBirth: '',
        education: { 
            degree: '', branch: '', collegeName: '', status: 'Pursuing',
            cgpa: 0, startYear: '', endYear: '', 
            tenthPercentage: 0, twelfthPercentage: 0 
        },
        skills: { technical: [], soft: [], tools: [] },
        resumeUrl: '', activeBacklogs: 0,
        address: { city: '', state: '', country: 'India' }, 
        linkedinUrl: '',
        isLocked: false, editRequestStatus: 'None', status: '', rejectionReason: ''
    });
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [activeNav, setActiveNav] = useState('overview');
    const [profileStep, setProfileStep] = useState(1);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [passMsg, setPassMsg] = useState('');
    const [search, setSearch] = useState({ location: '', skill: '' });
    const [evaluatingStudent, setEvaluatingStudent] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (profile.status === 'Approved') { fetchJobs(); fetchApplications(); }
    }, [profile.status]);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/student/profile');
            if (res.data) {
                setProfile(prev => ({
                    ...prev, ...res.data,
                    address: { ...prev.address, ...(res.data.address || {}) },
                    education: { ...prev.education, ...(res.data.education || {}) },
                    skills: { ...prev.skills, ...(res.data.skills || {}) }
                }));
                if (!res.data.isProfileComplete && res.data.status !== 'Approved') {
                    setActiveNav('profile');
                    setMsg({ type: 'warning', text: 'First Complete profile' });
                }
            }
        } catch (e) {}
    };

    const fetchJobs = async () => { try { const r = await api.get('/student/jobs/eligible'); setJobs(r.data); } catch (e) {} };
    const fetchApplications = async () => { try { const r = await api.get('/student/applications'); setApplications(r.data); } catch (e) {} };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();

        // ── Validation: Check if all profile fields are full! ──
        const reqBasic = ['name', 'contactNumber', 'gender', 'dateOfBirth', 'linkedinUrl'];
        for (let f of reqBasic) {
            if (!profile[f]) {
                setProfileStep(1);
                setMsg({ type: 'error', text: `Personal Details: Please fill out your ${f.replace(/([A-Z])/g, ' $1').toLowerCase()}` });
                return;
            }
        }

        if (profile.contactNumber && !/^[789]\d{9}$/.test(profile.contactNumber)) {
            setProfileStep(1);
            setMsg({ type: 'error', text: 'Personal Details: Contact number must be exactly 10 digits and start with 7, 8, or 9' });
            return;
        }

        if (!profile.address?.city || !profile.address?.state) {
            setProfileStep(1);
            setMsg({ type: 'error', text: 'Personal Details: Please provide your city and state' });
            return;
        }

        const reqEdu = ['collegeName', 'degree', 'branch', 'cgpa', 'startYear', 'endYear', 'tenthPercentage', 'twelfthPercentage'];
        for (let f of reqEdu) {
            if (!profile.education?.[f] && profile.education?.[f] !== 0) {
                setProfileStep(2);
                setMsg({ type: 'error', text: `Education: Please fill out your ${f.replace(/([A-Z])/g, ' $1').toLowerCase()}` });
                return;
            }
        }

        if (!profile.skills?.technical?.length) {
            setProfileStep(3);
            setMsg({ type: 'error', text: 'Skills: Please list at least one technical skill' });
            return;
        }
        if (!profile.skills?.soft?.length) {
            setProfileStep(3);
            setMsg({ type: 'error', text: 'Skills: Please list at least one soft skill' });
            return;
        }
        if (!profile.resumeUrl) {
            setProfileStep(3);
            setMsg({ type: 'error', text: 'Skills: Please provide a valid Resume URL or upload a file' });
            return;
        }

        if (profile.resumeUrl && profile.resumeUrl.trim().startsWith('file:///')) {
            setProfileStep(3);
            setMsg({ type: 'error', text: 'Local files (file:///) cannot be used. Please upload your resume online (e.g. Google Drive) and paste the public link here.' });
            return;
        }

        try {
            await api.put('/student/profile', profile);
            setMsg({ type: 'success', text: 'Profile saved successfully!' });
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
            fetchProfile();
        } catch (err) { setMsg({ type: 'error', text: err.response?.data?.error || 'Update failed' }); }
    };

    const handleSubmitForApproval = async () => {
        // Validation checks
        const reqBasic = ['name', 'contactNumber', 'gender', 'dateOfBirth', 'linkedinUrl'];
        for (let f of reqBasic) {
            if (!profile[f]) {
                setProfileStep(1);
                setMsg({ type: 'error', text: `Personal Details: Please fill out your ${f.replace(/([A-Z])/g, ' $1').toLowerCase()}` });
                return;
            }
        }
        if (profile.contactNumber && !/^[789]\d{9}$/.test(profile.contactNumber)) {
            setProfileStep(1);
            setMsg({ type: 'error', text: 'Personal Details: Contact number must be exactly 10 digits and start with 7, 8, or 9' });
            return;
        }
        if (!profile.address?.city || !profile.address?.state) {
            setProfileStep(1);
            setMsg({ type: 'error', text: 'Personal Details: Please provide your city and state' });
            return;
        }
        const reqEdu = ['collegeName', 'degree', 'branch', 'cgpa', 'startYear', 'endYear', 'tenthPercentage', 'twelfthPercentage'];
        for (let f of reqEdu) {
            if (!profile.education?.[f] && profile.education?.[f] !== 0) {
                setProfileStep(2);
                setMsg({ type: 'error', text: `Education: Please fill out your ${f.replace(/([A-Z])/g, ' $1').toLowerCase()}` });
                return;
            }
        }
        if (!profile.skills?.technical?.length) {
            setProfileStep(3);
            setMsg({ type: 'error', text: 'Skills: Please list at least one technical skill' });
            return;
        }
        if (!profile.skills?.soft?.length) {
            setProfileStep(3);
            setMsg({ type: 'error', text: 'Skills: Please list at least one soft skill' });
            return;
        }
        if (!profile.resumeUrl) {
            setProfileStep(3);
            setMsg({ type: 'error', text: 'Skills: Please provide a valid Resume URL or upload a file' });
            return;
        }
        if (profile.resumeUrl && profile.resumeUrl.trim().startsWith('file:///')) {
            setProfileStep(3);
            setMsg({ type: 'error', text: 'Local files (file:///) cannot be used. Please upload your resume online.' });
            return;
        }

        try {
            await api.put('/student/profile', profile); // Auto-save first
            await api.post('/student/submit-profile');
            setMsg({ type: 'success', text: 'your profile request sent to admin approval' });
            fetchProfile();
        } catch (err) { setMsg({ type: 'error', text: err.response?.data?.error || 'Submission failed' }); }
    };

    const handleApply = async (jobId) => {
        try { 
            await api.post(`/student/jobs/${jobId}/apply`); 
            setMsg({ type: 'success', text: 'Application submitted!' }); 
            fetchApplications(); 
            fetchJobs();
        }
        catch (err) { setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to apply' }); }
    };

    const requestEditPermission = async () => {
        try { await api.post('/student/request-edit'); setMsg({ type: 'success', text: 'Edit request sent to admin.' }); fetchProfile(); }
        catch (err) { setMsg({ type: 'error', text: err.response?.data?.error || 'Request failed' }); }
    };

    const handlePasswordReset = async () => {
        try { await api.post('/auth/forgot-password', { email: user.email }); setPassMsg('Password reset link sent to your email!'); }
        catch { setPassMsg('Failed to send reset link'); }
    };

    /* Filtering */
    const filteredJobs = jobs.filter(j => {
        const matchesLoc = !search.location || j.location?.toLowerCase().includes(search.location.toLowerCase());
        const matchesSkill = !search.skill || j.requiredSkills?.some(s => s.toLowerCase().includes(search.skill.toLowerCase()));
        return matchesLoc && matchesSkill;
    });

    /* Profile completion */
    const completion = (() => {
        let s = 0;
        const fields = [
            profile.name, profile.contactNumber, profile.gender, profile.dateOfBirth,
            profile.education?.degree, profile.education?.branch, profile.education?.collegeName,
            profile.education?.cgpa, profile.education?.endYear, profile.resumeUrl,
            profile.skills?.technical?.length, profile.address?.city, profile.linkedinUrl
        ];
        fields.forEach(f => { if(f) s++; });
        return Math.round((s / fields.length) * 100);
    })();

    /* Status counts */
    const statusCounts = applications.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});
    const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    const isLocked = profile.isLocked && profile.editRequestStatus !== 'Approved';
    const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'ST';

    return (
        <div className="app-layout">
            {/* ── SIDEBAR ── */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <GraduationCap size={20} color="white" />
                    </div>
                    <div>
                        <div className="sidebar-logo-text">PlacePortal</div>
                        <span className="sidebar-logo-sub">Student</span>
                    </div>
                </div>

                <div className="sidebar-body">
                    <span className="sidebar-section-label">Navigation</span>

                    {NAV.map(item => {
                        const Icon = item.icon;
                        const disabled = profile.status !== 'Approved' && (item.key === 'jobs' || item.key === 'applications' || item.key === 'mock-interview');
                        return (
                            <button
                                key={item.key}
                                className={`sidebar-link ${activeNav === item.key ? 'active' : ''}`}
                                onClick={() => !disabled && setActiveNav(item.key)}
                                style={{ opacity: disabled ? 0.4 : 1 }}
                            >
                                <Icon size={17} />
                                <span>{item.label}</span>
                                {item.key === 'applications' && applications.length > 0 && (
                                    <span style={{ marginLeft: 'auto', fontSize: 10, background: 'var(--primary)', color: 'white', padding: '1px 6px', borderRadius: 10 }}>{applications.length}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="sidebar-footer">
                    <div className="strength-bar" style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>Profile Strength</span>
                            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)' }}>{completion}%</span>
                        </div>
                        <div className="progress-track" style={{ height: 4 }}>
                            <div className="progress-fill" style={{ width: `${completion}%`, background: 'var(--primary)' }}></div>
                        </div>
                    </div>

                    <div className="sidebar-user" onClick={logout} title="Sign out" style={{ cursor: 'pointer' }}>
                        <div className="sidebar-user-avatar" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 800 }}>
                            {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name || 'Student'}</div>
                            <div className="sidebar-user-role">Sign out</div>
                        </div>
                        <LogOut size={14} color="var(--text-muted)" />
                    </div>
                </div>
            </aside>

            {/* ── MAIN ── */}
            <div className="main-wrapper">
                <nav className="navbar">
                    <div className="navbar-left">
                        <div>
                            <div className="navbar-page-title">{NAV.find(n => n.key === activeNav)?.label || 'Dashboard'}</div>
                            <div className="navbar-breadcrumb">PlacePortal / {activeNav}</div>
                        </div>
                    </div>

                    <div className="navbar-right">
                        <div className={`navbar-status badge ${profile.status === 'Approved' ? 'badge-success' : profile.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                            {profile.status || 'Draft'}
                        </div>
                        <button className="navbar-icon-btn"><Bell size={16} /></button>
                        <div className="navbar-profile">
                            <div className="navbar-profile-avatar" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 800 }}>{initials}</div>
                            <div>
                                <div className="navbar-profile-name">{profile.name || 'Student'}</div>
                                <div className="navbar-profile-role">{user.email}</div>
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="page-content">
                    {profile.status !== 'Approved' && (activeNav === 'jobs' || activeNav === 'applications' || activeNav === 'mock-interview') ? (
                        <div className="animate-scale-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
                            <div className="card" style={{ maxWidth: 420, textAlign: 'center', padding: '48px 40px' }}>
                                <div style={{ width: 60, height: 60, background: 'var(--warning-soft)', borderRadius: 'var(--r-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <AlertCircle size={30} color="var(--warning)" />
                                </div>
                                <h2 style={{ fontSize: 18, marginBottom: 10 }}>Account Pending Approval</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>Your account needs admin approval before accessing core features. Please complete and submit your profile.</p>
                                <button className="btn btn-primary btn-full" onClick={() => setActiveNav('profile')}>Go to Profile →</button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-up">

                            {/* ── OVERVIEW ── */}
                            {activeNav === 'overview' && (
                                <>
                                    <div style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', borderRadius: 'var(--r-2xl)', padding: '28px 32px', marginBottom: 24, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <p style={{ opacity: 0.8, fontSize: 13, marginBottom: 4 }}>Opportunities ahead 👋</p>
                                            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 6 }}>{profile.name || 'Welcome!'}</h1>
                                            <p style={{ opacity: 0.8, fontSize: 13 }}>{jobs.filter(j => j.status === 'Open').length} jobs are currently open for applications.</p>
                                        </div>
                                        <div style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--r-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: 'white' }}>{initials}</div>
                                    </div>

                                    <div className="stat-grid stagger" style={{ marginBottom: 24 }}>
                                        {[
                                            { label: 'Total Jobs', value: jobs.length, icon: Briefcase, color: '#2563EB', soft: '#EFF6FF' },
                                            { label: 'Applied', value: applications.length, icon: FileText, color: '#4B5563', soft: '#F3F4F6' },
                                            { label: 'Shortlisted', value: statusCounts['Shortlisted'] || 0, icon: Award, color: '#D97706', soft: '#FFFBEB' },
                                            { label: 'Selected', value: statusCounts['Selected'] || 0, icon: CheckCircle2, color: '#059669', soft: '#ECFDF5' },
                                        ].map((card, i) => {
                                            const Icon = card.icon;
                                            return (
                                                <div key={i} className="stat-card animate-fade-up" style={{ '--stat-color': card.color, '--stat-soft': card.soft, animationDelay: `${i * 0.07}s` }}>
                                                    <div className="stat-card-top"><div className="stat-card-icon"><Icon size={20} /></div></div>
                                                    <div className="stat-card-value">{card.value}</div>
                                                    <div className="stat-card-label">{card.label}</div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {applications.length > 0 && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)', gap: 16, marginBottom: 24 }}>
                                            <div className="chart-card">
                                                <div className="card-header"><div className="card-title">Application Status</div></div>
                                                <ResponsiveContainer width="100%" height={200}>
                                                    <PieChart>
                                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                                                            {pieData.map((d) => <Cell key={d.name} fill={STATUS_COLORS[d.name] || '#9CA3AF'} />)}
                                                        </Pie>
                                                        <Tooltip content={<CustomTooltip />} />
                                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="chart-card">
                                                <div className="card-header"><div className="card-title">Number of Applications by Status</div></div>
                                                <ResponsiveContainer width="100%" height={200}>
                                                    <BarChart data={pieData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF0" vertical={false} />
                                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                                                        <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={false} axisLine={false} tickLine={false} />
                                                        <Tooltip content={<CustomTooltip />} />
                                                        <Bar dataKey="value" name="Applications" fill="#2563EB" radius={[4, 4, 0, 0]}>
                                                            {pieData.map((d) => <Cell key={d.name} fill={STATUS_COLORS[d.name] || '#2563EB'} />)}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}

                                    {applications.length > 0 && (
                                        <div className="table-card">
                                            <div className="table-header"><div className="table-title">Recent Applications</div></div>
                                            <table className="data-table">
                                                <thead><tr><th>Job Title</th><th>Company</th><th>Status</th><th>Applied</th></tr></thead>
                                                <tbody>
                                                    {applications.slice(0, 5).map(app => (
                                                        <tr key={app._id}>
                                                            <td className="cell-primary">{app.job?.title || '—'}</td>
                                                            <td>{app.job?.company?.companyName || '—'}</td>
                                                            <td><span className={`badge badge-${(app.status || 'applied').toLowerCase().replace(' ', '-')}`}><span className="badge-dot"></span>{app.status}</span></td>
                                                            <td>{new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* ── JOBS ── */}
                            {activeNav === 'jobs' && (
                                <>
                                    <div className="page-header page-header-row">
                                        <div>
                                            <h1>Career Opportunities</h1>
                                            <p>{filteredJobs.length} matches found</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <div className="input-group" style={{ width: 180 }}>
                                                <div className="input-group-icon"><MapPin size={14} /></div>
                                                <input className="form-control" style={{ height: 36, fontSize: 12 }} placeholder="Location..." value={search.location} onChange={e => setSearch({...search, location: e.target.value})} />
                                            </div>
                                            <div className="input-group" style={{ width: 180 }}>
                                                <div className="input-group-icon"><Briefcase size={14} /></div>
                                                <input className="form-control" style={{ height: 36, fontSize: 12 }} placeholder="Skills..." value={search.skill} onChange={e => setSearch({...search, skill: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>
                                    {msg.text && <div className={`alert alert-${msg.type}`}><AlertCircle size={16} />{msg.text}</div>}
                                    <div className="grid-3" style={{ gap: 20 }}>
                                        {filteredJobs.map(job => {
                                            const hasApplied = applications.some(a => a.job?._id === job._id);
                                            return (
                                                <div key={job._id} className="job-card animate-fade-up">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                                                        <div className="job-card-logo" style={{ background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 800 }}>{(job.company?.companyName || 'C')[0]}</div>
                                                        <span className={`badge badge-${job.status.toLowerCase().replace(' ', '-')}`} style={{ fontSize: 10 }}>{job.status}</span>
                                                    </div>
                                                    <div style={{ marginBottom: 14 }}>
                                                        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>{job.title}</h3>
                                                        <p style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>{job.company?.companyName}</p>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                                                        <span className="badge" style={{ background: '#F3F4F6' }}>{job.salary || '—'}</span>
                                                        <span className="badge" style={{ background: '#F3F4F6' }}><MapPin size={10} /> {job.location || 'Remote'}</span>
                                                    </div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
                                                        <div style={{ marginBottom: 6 }}><strong>Skills:</strong> {job.requiredSkills?.join(', ') || '—'}</div>
                                                        <div><strong>Ends:</strong> {new Date(job.appCloseDate).toLocaleDateString()}</div>
                                                    </div>
                                                    <button 
                                                        className="btn btn-primary btn-full" 
                                                        disabled={job.status !== 'Open' || hasApplied} 
                                                        onClick={() => handleApply(job._id)}
                                                    >
                                                        {hasApplied ? 'Already Applied' : job.status === 'Open' ? 'Apply Now' : job.status}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {filteredJobs.length === 0 && (
                                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0' }}>
                                                <Briefcase size={40} color="#E5E7EB" style={{ marginBottom: 16 }} />
                                                <p style={{ color: 'var(--text-muted)' }}>No jobs found matching your criteria</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* ── APPLICATIONS ── */}
                            {activeNav === 'applications' && (
                                <>
                                    <div className="page-header">
                                        <h1>Track Applications</h1>
                                        <p>Monitor your progress through the recruitment cycle</p>
                                    </div>
                                    <div className="table-card">
                                        <table className="data-table">
                                            <thead><tr><th>Job</th><th>Company</th><th>Status</th><th>Applied On</th></tr></thead>
                                            <tbody>
                                                {applications.map(app => (
                                                    <tr key={app._id}>
                                                        <td className="cell-primary">{app.job?.title || '—'}</td>
                                                        <td>{app.job?.company?.companyName || '—'}</td>
                                                        <td><span className={`badge badge-${(app.status || 'applied').toLowerCase().replace(' ', '-')}`}><span className="badge-dot"></span>{app.status}</span></td>
                                                        <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                                {applications.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40 }}>No applications found</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}

                            {/* ── MOCK INTERVIEW ── */}
                            {activeNav === 'mock-interview' && <MockInterview />}

                            {/* ── AI RESUME SCANNER ── */}
                            {activeNav === 'resume-scanner' && (
                                <div className="card animate-fade-up">
                                    <div className="card-header">
                                        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <Bot color="var(--purple)" size={20} />
                                            AI Resume Scanner
                                        </div>
                                    </div>
                                    <div style={{ padding: '0 20px 20px', color: 'var(--text-sub)', fontSize: 14 }}>
                                        <p style={{ marginBottom: 16, lineHeight: 1.6 }}>
                                            We will securely analyze your profile data and your uploaded resume using advanced AI to provide an ATS score, identify missing skills, and suggest actionable improvements tailored to entry-level / intern roles. 
                                            This will boost your chances of getting shortlisted.
                                        </p>
                                        
                                        {!profile.resumeUrl ? (
                                            <div className="alert alert-warning" style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 0 }}>
                                                <AlertCircle size={20} />
                                                <span>You must upload a resume or provide a valid Google Drive link in your <b>Profile</b> section before using the AI Scanner.</span>
                                            </div>
                                        ) : (
                                            <button 
                                                className="btn btn-primary"
                                                onClick={() => setEvaluatingStudent(true)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--purple)', borderColor: 'var(--purple)' }}
                                            >
                                                <Bot size={18} />
                                                Analyze My Resume Now
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── PROFILE ── */}
                            {activeNav === 'profile' && (
                                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1 1 500px', maxWidth: 800 }}>
                                    <div className="page-header">
                                        <h1>Professional Profile</h1>
                                        <p>Information used for job eligibility and recruiter visibility</p>
                                    </div>
                                    {isLocked && (
                                        <div className="locked-banner" style={{ background: '#FFFBE6', border: '1px solid #FFE58F', color: '#856404', padding: '10px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                            <AlertCircle size={16} />
                                            <span style={{ fontSize: 12.5, flex: 1 }}>Profile is locked. Request admin edit permission if changes are needed.</span>
                                            {profile.editRequestStatus === 'None' && <button onClick={requestEditPermission} className="btn btn-sm" style={{ background: '#FAAD14', color: 'white', border: 'none', padding: '4px 10px', height: 'auto' }}>Request Edit</button>}
                                        </div>
                                    )}
                                    {profile.status === 'Rejected' && (
                                        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
                                            <strong>Profile Rejected:</strong> {profile.rejectionReason}
                                            <br/>Please make the necessary changes and submit again.
                                        </div>
                                    )}
                                    {profile.status === 'Pending' && (
                                        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
                                            Your profile is currently pending admin approval. You cannot make edits at this time.
                                        </div>
                                    )}
                                    {msg.text && <div className={`alert alert-${msg.type}`}><AlertCircle size={16} />{msg.text}</div>}
                                    <div className="card">
                                        {/* Simplified Step UI */}
                                        <div style={{ display: 'flex', gap: 24, marginBottom: 30, borderBottom: '1px solid #F3F4F6' }}>
                                            {['Personal', 'Education', 'Skills'].map((l, i) => (
                                                <button key={i} onClick={() => setProfileStep(i+1)} style={{ padding: '0 0 12px 0', background: 'none', border: 'none', borderBottom: profileStep === i+1 ? '2px solid var(--primary)' : '2px solid transparent', color: profileStep === i+1 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{l}</button>
                                            ))}
                                        </div>
                                        <form onSubmit={handleProfileUpdate}>
                                            {profileStep === 1 && (
                                                <div className="grid-2" style={{ gap: 16 }}>
                                                    <div className="form-group"><label className="form-label">Name</label><input className="form-control" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} disabled={isLocked} /></div>
                                                    <div className="form-group"><label className="form-label">Phone</label><input className="form-control" maxLength="10" placeholder="e.g. 9876543210" value={profile.contactNumber} onChange={e => setProfile({...profile, contactNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})} disabled={isLocked} /></div>
                                                    <div className="form-group">
                                                        <label className="form-label">Gender</label>
                                                        <select className="form-control" value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})} disabled={isLocked}>
                                                            <option value="">Select Gender</option>
                                                            {['Male', 'Female', 'Other', 'Prefer not to say'].map(g => <option key={g} value={g}>{g}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-control" value={profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : ''} onChange={e => setProfile({...profile, dateOfBirth: e.target.value})} disabled={isLocked} /></div>
                                                    <div className="form-group"><label className="form-label">City</label><input className="form-control" value={profile.address?.city} onChange={e => setProfile({...profile, address: {...profile.address, city: e.target.value}})} disabled={isLocked} /></div>
                                                    <div className="form-group"><label className="form-label">State</label><input className="form-control" value={profile.address?.state} onChange={e => setProfile({...profile, address: {...profile.address, state: e.target.value}})} disabled={isLocked} /></div>
                                                    <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">LinkedIn URL</label><input type="url" className="form-control" value={profile.linkedinUrl} onChange={e => setProfile({...profile, linkedinUrl: e.target.value})} disabled={isLocked} /></div>
                                                </div>
                                            )}
                                            {profileStep === 2 && (
                                                 <div className="grid-2" style={{ gap: 16 }}>
                                                     <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">College Name</label><input className="form-control" value={profile.education?.collegeName} onChange={e => setProfile({...profile, education: {...profile.education, collegeName: e.target.value}})} disabled={isLocked} /></div>
                                                     <div className="form-group"><label className="form-label">Degree</label><select className="form-control" value={profile.education?.degree} onChange={e => setProfile({...profile, education: {...profile.education, degree: e.target.value, branch: e.target.value}})} disabled={isLocked}><option value="">Select...</option><option value="B.Tech (Computer Science)">B.Tech (Computer Science)</option><option value="B.Tech (Information Technology)">B.Tech (Information Technology)</option><option value="B.E. (Computer Science)">B.E. (Computer Science)</option><option value="B.E. (Information Technology)">B.E. (Information Technology)</option><option value="BCA">BCA</option><option value="MCA">MCA</option><option value="B.Sc (Computer Science)">B.Sc (Computer Science)</option><option value="B.Sc (IT)">B.Sc (IT)</option><option value="M.Sc (IT)">M.Sc (IT)</option><option value="Diploma (Computer Engineering)">Diploma (Computer Engineering)</option><option value="Diploma (IT)">Diploma (IT)</option></select></div>

                                                     <div className="form-group">
                                                        <label className="form-label">Education Status</label>
                                                        {(() => {
                                                            const currentYear = new Date().getFullYear();
                                                            const currentMonth = new Date().getMonth() + 1;
                                                            const endYear = profile.education?.endYear;
                                                            const hasPassed = endYear && (endYear < currentYear || (endYear === currentYear && currentMonth > 6));
                                                            const autoStatus = hasPassed ? 'Completed' : 'Pursuing';
                                                            return (
                                                                <>
                                                                    <div style={{ 
                                                                        fontWeight: 700, 
                                                                        fontSize: 14, 
                                                                        padding: '10px 0',
                                                                        color: autoStatus === 'Completed' ? '#059669' : '#2563EB' 
                                                                    }}>
                                                                        {autoStatus}
                                                                    </div>
                                                                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: -4 }}>
                                                                        (Auto-computed based on Passing Year)
                                                                    </p>
                                                                </>
                                                            );
                                                        })()}
                                                     </div>
                                                     <div className="form-group"><label className="form-label">CGPA</label><input className="form-control" type="number" step="0.01" value={profile.education?.cgpa} onChange={e => setProfile({...profile, education: {...profile.education, cgpa: parseFloat(e.target.value)}})} disabled={isLocked} /></div>
                                                     <div className="form-group"><label className="form-label">Start Year</label><input className="form-control" type="number" placeholder="2023" value={profile.education?.startYear} onChange={e => setProfile({...profile, education: {...profile.education, startYear: parseInt(e.target.value)}})} disabled={isLocked} /></div>
                                                     <div className="form-group"><label className="form-label">End Year (Passing)</label><input className="form-control" type="number" placeholder="2027" value={profile.education?.endYear} onChange={e => setProfile({...profile, education: {...profile.education, endYear: parseInt(e.target.value)}})} disabled={isLocked} /></div>
                                                     <div className="form-group"><label className="form-label">10th Percentage</label><input className="form-control" type="number" step="0.1" value={profile.education?.tenthPercentage} onChange={e => setProfile({...profile, education: {...profile.education, tenthPercentage: parseFloat(e.target.value)}})} disabled={isLocked} /></div>
                                                     <div className="form-group"><label className="form-label">12th Percentage</label><input className="form-control" type="number" step="0.1" value={profile.education?.twelfthPercentage} onChange={e => setProfile({...profile, education: {...profile.education, twelfthPercentage: parseFloat(e.target.value)}})} disabled={isLocked} /></div>
                                                 </div>
                                             )}
                                            {profileStep === 3 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                    <div className="form-group"><label className="form-label">Technical Skills (CSV)</label><textarea className="form-textarea" rows={2} value={profile.skills?.technical?.join(', ')} onChange={e => setProfile({...profile, skills: {...profile.skills, technical: e.target.value.split(',').map(s => s.trim())}})} disabled={isLocked} placeholder="React, Node.js, MongoDB..." /></div>
                                                    <div className="form-group"><label className="form-label">Soft Skills (CSV)</label><textarea className="form-textarea" rows={2} value={profile.skills?.soft?.join(', ')} onChange={e => setProfile({...profile, skills: {...profile.skills, soft: e.target.value.split(',').map(s => s.trim())}})} disabled={isLocked} placeholder="Leadership, Communication..." /></div>
                                                    <div className="form-group"><label className="form-label">Tools (CSV)</label><textarea className="form-textarea" rows={2} value={profile.skills?.tools?.join(', ')} onChange={e => setProfile({...profile, skills: {...profile.skills, tools: e.target.value.split(',').map(s => s.trim())}})} disabled={isLocked} placeholder="VS Code, Docker, Postman..." /></div>
                                                    <div>
                                                        <label className="form-label">Resume (URL or Local File)</label>
                                                        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                                                            <input type="url" className="form-control" style={{ flex: 1 }} value={profile.resumeUrl} onChange={e => setProfile({...profile, resumeUrl: e.target.value})} disabled={isLocked} placeholder="Paste link or click Upload ->" />
                                                            <label className="btn btn-outline" style={{ cursor: isLocked ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', margin: 0, padding: '0 12px', fontSize: 13 }}>
                                                                Upload PDF
                                                                <input 
                                                                    type="file" 
                                                                    accept=".pdf,.doc,.docx" 
                                                                    style={{ display: 'none' }} 
                                                                    disabled={isLocked}
                                                                    onChange={async (e) => {
                                                                        if (!e.target.files[0]) return;
                                                                        const fd = new FormData();
                                                                        fd.append('resume', e.target.files[0]);
                                                                        try {
                                                                            const { data } = await api.post('/student/upload-resume', fd, { headers: { 'Content-Type': 'multipart/form-data' }});
                                                                            setProfile({...profile, resumeUrl: data.url});
                                                                            setMsg({ type: 'success', text: 'Resume file uploaded successfully!' });
                                                                        } catch(err) {
                                                                            setMsg({ type: 'error', text: 'Failed to upload resume file' });
                                                                        }
                                                                    }} 
                                                                />
                                                            </label>
                                                        </div>
                                                        {profile.resumeUrl && profile.resumeUrl.trim().startsWith('file:///') && (
                                                            <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>⚠️ Error: You pasted a local path. Click "Upload PDF" instead!</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div style={{ marginTop: 30, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                                {profileStep > 1 && <button type="button" onClick={() => setProfileStep(s => s-1)} className="btn btn-outline">Back</button>}
                                                {profileStep < 3 ? <button type="button" onClick={() => setProfileStep(s => s+1)} className="btn btn-primary">Next</button> : 
                                                    <>
                                                        <button type="submit" className="btn btn-outline" disabled={isLocked || profile.status === 'Pending'}>Save Draft</button>
                                                        <button type="button" onClick={handleSubmitForApproval} className="btn btn-primary" disabled={isLocked || profile.status === 'Pending'}>Submit for Approval</button>
                                                    </>
                                                }
                                            </div>
                                        </form>
                                    </div>
                                </div>
                                <div style={{ flex: '0 0 320px' }}>
                                    <div className="card">
                                        <div className="card-title" style={{ marginBottom: 16 }}>Change Password</div>
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Send reset link to your registered email.</p>
                                        <button onClick={handlePasswordReset} className="btn btn-primary btn-full">Send Reset Link</button>
                                        {passMsg && <div className="alert alert-success" style={{ marginTop: 16 }}>{passMsg}</div>}
                                    </div>
                                </div>
                            </div>
                            )}

                        </div>
                    )}
                </div>
            </div>

            {evaluatingStudent && (
                <ATSEvaluationModal 
                    student={profile} 
                    onClose={() => setEvaluatingStudent(false)} 
                />
            )}
        </div>
    );
};

export default StudentDashboard;
