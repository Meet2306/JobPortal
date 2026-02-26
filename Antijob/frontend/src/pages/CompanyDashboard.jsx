import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Building, PlusCircle, List, Users } from 'lucide-react';

const CompanyDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [profile, setProfile] = useState({});
    const [jobs, setJobs] = useState([]);
    const [applicants, setApplicants] = useState([]);
    const [tab, setTab] = useState('profile'); // profile, create-job, jobs, applicants
    const [selectedJob, setSelectedJob] = useState(null);
    const [msg, setMsg] = useState('');

    // Job Form State
    const [jobForm, setJobForm] = useState({ title: '', description: '', location: '', package: 0, minCGPA: 0, allowedBranches: '', passingYear: 2024, maxBacklogs: 0 });

    useEffect(() => {
        fetchProfile();
        if (user.isVerified) fetchJobs();
    }, [user.isVerified]);

    const fetchProfile = async () => { const res = await api.get('/company/profile'); setProfile(res.data); };
    const fetchJobs = async () => { try { const res = await api.get('/company/jobs'); setJobs(res.data); } catch (err) { } };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put('/company/profile', profile);
            setMsg('Company Profile updated!');
        } catch (err) {
            setMsg(err.response?.data?.error || 'Failed to update');
        }
    };

    const handleCreateJob = async (e) => {
        e.preventDefault();
        try {
            const branches = jobForm.allowedBranches.split(',').map(b => b.trim()).filter(b => b);
            const payload = {
                title: jobForm.title, description: jobForm.description, location: jobForm.location, package: parseFloat(jobForm.package),
                criteria: {
                    minCGPA: parseFloat(jobForm.minCGPA), allowedBranches: branches, passingYear: parseInt(jobForm.passingYear), maxBacklogs: parseInt(jobForm.maxBacklogs)
                }
            };
            await api.post('/company/jobs', payload);
            alert('Job posted for Admin Approval');
            setJobForm({ title: '', description: '', location: '', package: 0, minCGPA: 0, allowedBranches: '', passingYear: 2024, maxBacklogs: 0 });
            setTab('jobs');
            fetchJobs();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to post job');
        }
    };

    const viewApplicants = async (jobId) => {
        try {
            const res = await api.get(`/company/jobs/${jobId}/applicants`);
            setApplicants(res.data);
            setSelectedJob(jobId);
            setTab('applicants');
        } catch (err) {
            alert('Failed to load applicants');
        }
    };

    const updateAppStatus = async (appId, newStatus) => {
        try {
            await api.patch(`/company/applications/${appId}/status`, { status: newStatus, remarks: 'Updated by company' });
            const res = await api.get(`/company/jobs/${selectedJob}/applicants`);
            setApplicants(res.data);
        } catch (err) {
            alert(err.response?.data?.error || 'State transition failed');
        }
    };

    return (
        <div>
            <nav className="navbar">
                <div className="navbar-brand">Company Portal</div>
                <div className="navbar-links">
                    <span className="badge badge-info">{user.isVerified ? 'APPROVED' : 'PENDING TPO APPROVAL'}</span>
                    <button onClick={logout} className="btn btn-outline"><LogOut size={16} /> Logout</button>
                </div>
            </nav>

            <div className="container">
                <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    <button className={`btn ${tab === 'profile' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('profile')}><Building size={16} /> Profile</button>
                    <button className={`btn ${tab === 'create-job' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('create-job')} disabled={!user.isVerified}><PlusCircle size={16} /> Post Job</button>
                    <button className={`btn ${tab === 'jobs' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('jobs')} disabled={!user.isVerified}><List size={16} /> Job Listings</button>
                </div>

                {tab === 'profile' && (
                    <div className="glass-panel animate-fade" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h3>Company Details</h3>
                        {msg && <p className="success-text">{msg}</p>}
                        <form onSubmit={handleProfileUpdate}>
                            <div className="form-group"><label>Company Name</label><input type="text" className="form-control" value={profile.companyName || ''} onChange={e => setProfile({ ...profile, companyName: e.target.value })} required /></div>
                            <div className="grid-2">
                                <div className="form-group"><label>Industry</label><input type="text" className="form-control" value={profile.industry || ''} onChange={e => setProfile({ ...profile, industry: e.target.value })} required /></div>
                                <div className="form-group"><label>Website</label><input type="url" className="form-control" value={profile.websiteUrl || ''} onChange={e => setProfile({ ...profile, websiteUrl: e.target.value })} /></div>
                                <div className="form-group"><label>HR Name</label><input type="text" className="form-control" value={profile.hrContactName || ''} onChange={e => setProfile({ ...profile, hrContactName: e.target.value })} required /></div>
                                <div className="form-group"><label>HR Contact</label><input type="text" className="form-control" value={profile.hrContactNumber || ''} onChange={e => setProfile({ ...profile, hrContactNumber: e.target.value })} required /></div>
                            </div>
                            <div className="form-group"><label>Description</label><textarea className="form-control" rows="3" value={profile.description || ''} onChange={e => setProfile({ ...profile, description: e.target.value })}></textarea></div>
                            <button type="submit" className="btn btn-primary">Save Company Profile</button>
                        </form>
                    </div>
                )}

                {tab === 'create-job' && (
                    <div className="glass-panel animate-fade" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h3>Draft New Job Posting</h3>
                        <form onSubmit={handleCreateJob}>
                            <div className="grid-2">
                                <div className="form-group"><label>Job Title</label><input type="text" className="form-control" value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} required /></div>
                                <div className="form-group"><label>Location</label><input type="text" className="form-control" value={jobForm.location} onChange={e => setJobForm({ ...jobForm, location: e.target.value })} required /></div>
                            </div>
                            <div className="form-group"><label>Package (in LPA)</label><input type="number" step="0.01" className="form-control" value={jobForm.package} onChange={e => setJobForm({ ...jobForm, package: e.target.value })} required /></div>
                            <div className="form-group"><label>Job Description</label><textarea className="form-control" rows="3" value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} required></textarea></div>
                            <h4 style={{ marginTop: '30px' }}>Eligibility Rule Engine Criteria</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--warning)', marginBottom: '15px' }}>Only students meeting these EXACT criteria will see and apply to this job. Server enforces this.</p>
                            <div className="grid-2">
                                <div className="form-group"><label>Minimum CGPA</label><input type="number" step="0.01" className="form-control" value={jobForm.minCGPA} onChange={e => setJobForm({ ...jobForm, minCGPA: e.target.value })} required /></div>
                                <div className="form-group"><label>Max Active Backlogs</label><input type="number" className="form-control" value={jobForm.maxBacklogs} onChange={e => setJobForm({ ...jobForm, maxBacklogs: e.target.value })} required /></div>
                                <div className="form-group"><label>Allowed Branch Codes (comma separated)</label><input type="text" className="form-control" placeholder="CSE, IT, ECE" value={jobForm.allowedBranches} onChange={e => setJobForm({ ...jobForm, allowedBranches: e.target.value })} required /></div>
                                <div className="form-group"><label>Passing Year</label><input type="number" className="form-control" value={jobForm.passingYear} onChange={e => setJobForm({ ...jobForm, passingYear: e.target.value })} required /></div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '15px' }}><PlusCircle size={16} /> Submit for Approval</button>
                        </form>
                    </div>
                )}

                {tab === 'jobs' && (
                    <div className="glass-panel animate-fade">
                        <h3>Job Listings Status</h3>
                        <table className="data-table">
                            <thead><tr><th>Title</th><th>Package</th><th>States</th><th>Action</th></tr></thead>
                            <tbody>
                                {jobs.map(j => (
                                    <tr key={j._id}>
                                        <td>{j.title}</td>
                                        <td>₹{j.package} LPA</td>
                                        <td>
                                            <span className={`badge ${j.status === 'Live' ? 'badge-success' : j.status === 'Pending Approval' ? 'badge-pending' : j.status === 'Rejected' ? 'badge-danger' : 'badge-info'}`}>
                                                {j.status}
                                            </span>
                                        </td>
                                        <td>
                                            {j.status === 'Live' && <button onClick={() => viewApplicants(j._id)} className="btn btn-primary btn-sm"><Users size={16} /> View Applicants</button>}
                                            {j.remarks && <p style={{ fontSize: '0.75rem', marginTop: '5px', color: 'var(--warning)' }}>TPO Remark: {j.remarks}</p>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === 'applicants' && (
                    <div className="glass-panel animate-fade">
                        <h3>Job Applicants</h3>
                        <button onClick={() => setTab('jobs')} className="btn btn-outline" style={{ marginBottom: '20px' }}>Back</button>
                        <table className="data-table">
                            <thead><tr><th>Student ID</th><th>CGPA</th><th>Branch</th><th>Current State</th><th>Action Machine</th></tr></thead>
                            <tbody>
                                {applicants.map(app => (
                                    <tr key={app._id}>
                                        <td>{app.student.user.email}</td>
                                        <td>{app.student.cgpa}</td>
                                        <td>{app.student.branch}</td>
                                        <td>
                                            <span className={`badge ${app.status === 'Selected' ? 'badge-success' : app.status === 'Rejected' ? 'badge-danger' : 'badge-pending'}`}>{app.status}</span>
                                        </td>
                                        <td>
                                            {app.status !== 'Selected' && app.status !== 'Rejected' && (
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    <select className="form-select" style={{ width: 'auto', padding: '5px' }} onChange={(e) => updateAppStatus(app._id, e.target.value)} defaultValue="">
                                                        <option value="" disabled>Change State...</option>
                                                        {app.status === 'Applied' && <option value="Shortlisted">Shortlist Candidate</option>}
                                                        {app.status === 'Shortlisted' && <option value="Interview Scheduled">Schedule Interview</option>}
                                                        {app.status === 'Interview Scheduled' && <option value="Selected">Select (FinalOffer)</option>}
                                                        <option value="Rejected">Reject Candidate</option>
                                                    </select>
                                                </div>
                                            )}
                                            {(app.status === 'Selected' || app.status === 'Rejected') && <span className="badge badge-info.">Terminal State Reached</span>}
                                        </td>
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

export default CompanyDashboard;
