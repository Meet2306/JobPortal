import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User, Briefcase, FileText } from 'lucide-react';

const StudentDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [profile, setProfile] = useState({});
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [tab, setTab] = useState('profile'); // profile, jobs, applications
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetchProfile();
        if (user.isVerified) {
            fetchJobs();
            fetchApplications();
        }
    }, [user.isVerified]);

    const fetchProfile = async () => { const res = await api.get('/student/profile'); setProfile(res.data); };
    const fetchJobs = async () => { try { const res = await api.get('/student/jobs/eligible'); setJobs(res.data); } catch (err) { } };
    const fetchApplications = async () => { try { const res = await api.get('/student/applications'); setApplications(res.data); } catch (err) { } };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put('/student/profile', profile);
            setMsg('Profile updated!');
        } catch (err) {
            setMsg(err.response?.data?.error || 'Failed to update update');
        }
    };

    const handleApply = async (jobId) => {
        try {
            await api.post(`/student/jobs/${jobId}/apply`);
            alert('Applied successfully!');
            fetchApplications();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to apply');
        }
    };

    return (
        <div>
            <nav className="navbar">
                <div className="navbar-brand">Student Portal</div>
                <div className="navbar-links">
                    <span className="badge badge-info">{user.isVerified ? 'VERIFIED' : 'PENDING VERIFICATION'}</span>
                    <button onClick={logout} className="btn btn-outline"><LogOut size={16} /> Logout</button>
                </div>
            </nav>

            <div className="container">
                <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    <button className={`btn ${tab === 'profile' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('profile')}><User size={16} /> Profile</button>
                    <button className={`btn ${tab === 'jobs' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('jobs')} disabled={!user.isVerified}><Briefcase size={16} /> Eligible Jobs</button>
                    <button className={`btn ${tab === 'applications' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('applications')} disabled={!user.isVerified}><FileText size={16} /> Applications</button>
                </div>

                {tab === 'profile' && (
                    <div className="glass-panel animate-fade" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h3>Academic Profile</h3>
                        {msg && <p className="success-text">{msg}</p>}
                        <form onSubmit={handleProfileUpdate}>
                            <div className="grid-2">
                                <div className="form-group"><label>Full Name</label><input type="text" className="form-control" value={profile.name || ''} onChange={e => setProfile({ ...profile, name: e.target.value })} disabled={profile.isLocked} required /></div>
                                <div className="form-group"><label>Contact</label><input type="text" className="form-control" value={profile.contactNumber || ''} onChange={e => setProfile({ ...profile, contactNumber: e.target.value })} disabled={profile.isLocked} required /></div>
                                <div className="form-group"><label>CGPA</label><input type="number" step="0.01" className="form-control" value={profile.cgpa || 0} onChange={e => setProfile({ ...profile, cgpa: parseFloat(e.target.value) })} disabled={profile.isLocked} required /></div>
                                <div className="form-group"><label>Branch</label><select className="form-select" value={profile.branch || ''} onChange={e => setProfile({ ...profile, branch: e.target.value })} disabled={profile.isLocked} required><option value="TBD">TBD</option><option value="CSE">CSE</option><option value="IT">IT</option><option value="ECE">ECE</option><option value="MECH">MECH</option></select></div>
                                <div className="form-group"><label>Passing Year</label><input type="number" className="form-control" value={profile.passingYear || ''} onChange={e => setProfile({ ...profile, passingYear: parseInt(e.target.value) })} disabled={profile.isLocked} required /></div>
                                <div className="form-group"><label>Active Backlogs</label><input type="number" className="form-control" value={profile.activeBacklogs || 0} onChange={e => setProfile({ ...profile, activeBacklogs: parseInt(e.target.value) })} disabled={profile.isLocked} required /></div>
                            </div>
                            <div className="form-group"><label>Resume URL</label><input type="url" className="form-control" value={profile.resumeUrl || ''} onChange={e => setProfile({ ...profile, resumeUrl: e.target.value })} disabled={profile.isLocked} placeholder="https://drive.google.com/.../view" /></div>
                            {!profile.isLocked && <button type="submit" className="btn btn-primary">Save Profile</button>}
                            {profile.isLocked && <p className="error-text">Profile is locked by Admin. Cannot edit.</p>}
                        </form>
                    </div>
                )}

                {tab === 'jobs' && (
                    <div className="animate-fade">
                        <h3>Eligible Jobs Engine</h3>
                        <p style={{ marginBottom: '20px' }}>Only showing jobs you qualify for based on CGPA, Branch, Year, and Backlogs.</p>
                        <div className="grid-3">
                            {jobs.map(job => (
                                <div key={job._id} className="glass-panel">
                                    <h4 style={{ color: 'var(--primary)' }}>{job.title}</h4>
                                    <p><strong>Company:</strong> {job.company.companyName}</p>
                                    <p><strong>Package:</strong> ₹{job.package} LPA</p>
                                    <p><strong>Location:</strong> {job.location}</p>
                                    <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />
                                    <p style={{ fontSize: '0.85rem' }}>{job.description}</p>
                                    <button onClick={() => handleApply(job._id)} className="btn btn-primary" style={{ marginTop: '15px', width: '100%' }}>Apply Now</button>
                                </div>
                            ))}
                            {jobs.length === 0 && <p>No eligible jobs found for your profile.</p>}
                        </div>
                    </div>
                )}

                {tab === 'applications' && (
                    <div className="glass-panel animate-fade">
                        <h3>My Applications</h3>
                        <table className="data-table">
                            <thead><tr><th>Job Title</th><th>Company</th><th>Status</th><th>Applied on</th></tr></thead>
                            <tbody>
                                {applications.map(app => (
                                    <tr key={app._id}>
                                        <td>{app.job.title}</td>
                                        <td>{app.job.company.companyName}</td>
                                        <td><span className={`badge ${app.status === 'Selected' ? 'badge-success' : app.status === 'Rejected' ? 'badge-danger' : 'badge-pending'}`}>{app.status}</span></td>
                                        <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
