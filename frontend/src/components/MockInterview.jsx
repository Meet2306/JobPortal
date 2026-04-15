import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Play, CheckCircle2, AlertCircle, Loader } from 'lucide-react';

const MockInterview = () => {
    const [interviews, setInterviews] = useState([]);
    const [view, setView] = useState('list'); // list, create, session
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    
    // create form
    const [role, setRole] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');
    
    // session
    const [currentInterview, setCurrentInterview] = useState(null);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchInterviews();
    }, []);

    const fetchInterviews = async () => {
        try {
            setLoading(true);
            const res = await api.get('/student/mock-interview');
            setInterviews(res.data);
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');
        try {
            const res = await api.post('/student/mock-interview', { jobRole: role, difficulty });
            setCurrentInterview(res.data.interview);
            setActiveQuestionIndex(0);
            setView('session');
            setLoading(false);
            fetchInterviews(); // update list in background
        } catch (err) {
            setMsg(err.response?.data?.error || 'Failed to generate interview');
            setLoading(false);
        }
    };

    const submitAnswer = async () => {
        if (!answer.trim()) return;
        setSubmitting(true);
        try {
            const questionId = currentInterview.questions[activeQuestionIndex]._id;
            const res = await api.post(`/student/mock-interview/${currentInterview._id}/question/${questionId}/answer`, { answer });
            
            // Update the current interview locally
            setCurrentInterview(res.data.interview);
            setSubmitting(false);
            setAnswer('');
        } catch (err) {
            setSubmitting(false);
            alert('Failed to submit answer');
        }
    };

    const resumeInterview = (interview) => {
        setCurrentInterview(interview);
        // Find first unanswered question
        const firstUnanswered = interview.questions.findIndex(q => !q.isCompleted);
        setActiveQuestionIndex(firstUnanswered !== -1 ? firstUnanswered : 0);
        setView('session');
    };

    if (view === 'list') {
        return (
            <div>
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>Mock Interviews</h1>
                        <p>Practice with AI and get instant feedback.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setView('create')}>+ New AI Interview</button>
                </div>
                
                {loading ? <p>Loading past interviews...</p> : (
                    <div className="grid-2" style={{ gap: 20 }}>
                        {interviews.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', background: 'white', borderRadius: 'var(--r-xl)' }}>
                                <Play size={40} color="#E5E7EB" style={{ marginBottom: 16 }} />
                                <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No mock interviews yet. Start practicing now!</p>
                                <button className="btn btn-outline" onClick={() => setView('create')}>Generate AI Interview</button>
                            </div>
                        ) : (
                            interviews.map(inv => (
                                <div key={inv._id} className="card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <span className={`badge badge-${inv.status === 'Completed' ? 'success' : 'warning'}`}>{inv.status}</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>{inv.difficulty}</span>
                                    </div>
                                    <h3 style={{ fontSize: 16, marginBottom: 5 }}>{inv.jobRole}</h3>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                                        {new Date(inv.createdAt).toLocaleDateString()}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                                            {inv.status === 'Completed' ? `Score: ${inv.overallScore.toFixed(1)} / 10` : `${inv.questions.filter(q => q.isCompleted).length} / ${inv.questions.length} completed`}
                                        </div>
                                        <button className="btn btn-sm btn-outline" onClick={() => resumeInterview(inv)}>
                                            {inv.status === 'Completed' ? 'Review' : 'Continue'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        );
    }

    if (view === 'create') {
        return (
            <div style={{ maxWidth: 500 }}>
                <div className="page-header">
                    <h1>Configure Interview</h1>
                    <p>Tell the AI what role you are intervewing for.</p>
                </div>
                <div className="card">
                    {msg && <div className="alert alert-danger" style={{marginBottom: 16}}><AlertCircle size={14}/> {msg}</div>}
                    <form onSubmit={handleCreate}>
                        <div className="form-group">
                            <label className="form-label">Target Role (e.g. Frontend React Developer)</label>
                            <input className="form-control" required value={role} onChange={e => setRole(e.target.value)} placeholder="Type the exact position..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Difficulty Level</label>
                            <select className="form-control" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                            <button type="button" className="btn btn-outline" onClick={() => setView('list')} disabled={loading}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                                {loading ? 'Generating specific questions...' : 'Generate & Start AI Interview'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (view === 'session' && currentInterview) {
        const q = currentInterview.questions[activeQuestionIndex];
        const isCompleted = currentInterview.status === 'Completed';

        return (
            <div className="animate-fade-up">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <button className="btn btn-sm btn-outline" onClick={() => { setView('list'); fetchInterviews(); }}>← Exit Session</button>
                    <div style={{ fontWeight: 600, color: 'var(--primary)' }}>Question {activeQuestionIndex + 1} of {currentInterview.questions.length}</div>
                </div>

                <div className="grid-2" style={{ gap: 20, alignItems: 'start' }}>
                    <div className="card" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', position: 'sticky', top: 20 }}>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Interviewer (AI)</div>
                        <h2 style={{ fontSize: 18, lineHeight: 1.5, color: '#0F172A' }}>{q.question}</h2>
                    </div>

                    {!q.isCompleted ? (
                        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Answer</div>
                            <textarea 
                                className="form-textarea" 
                                rows={8} 
                                placeholder="Type your answer here to be evaluated..." 
                                value={answer} 
                                onChange={e => setAnswer(e.target.value)}
                                disabled={submitting}
                                style={{ flex: 1 }}
                            ></textarea>
                            <div style={{ marginTop: 16, textAlign: 'right' }}>
                                <button className="btn btn-primary" onClick={submitAnswer} disabled={submitting || !answer.trim()}>
                                    {submitting ? 'Evaluating...' : 'Submit Answer'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="card" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                           <div style={{ fontSize: 13, color: '#166534', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                               <span>Evaluation</span>
                               <span>Score: {q.score} / 10</span>
                           </div>
                           <div style={{ marginBottom: 16 }}>
                               <strong style={{ display: 'block', fontSize: 12, color: '#166534', opacity: 0.8, marginBottom: 4 }}>Your Answer:</strong>
                               <p style={{ fontSize: 14, color: '#166534' }}>{q.answer}</p>
                           </div>
                           <div style={{ padding: '12px 16px', background: 'white', borderRadius: 8 }}>
                               <strong style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 4 }}>Feedback:</strong>
                               <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{q.feedback}</p>
                           </div>

                           <div style={{ marginTop: 20, textAlign: 'right' }}>
                               {activeQuestionIndex < currentInterview.questions.length - 1 ? (
                                   <button className="btn btn-success" style={{ background: '#16A34A', color: 'white', border: 'none' }} onClick={() => setActiveQuestionIndex(i => i + 1)}>Next Question →</button>
                               ) : (
                                   <button className="btn btn-primary" onClick={() => { setView('list'); fetchInterviews(); }}>Finish Review</button>
                               )}
                           </div>
                        </div>
                    )}
                </div>

                {isCompleted && (
                    <div className="animate-fade-up" style={{ marginTop: 20, padding: 20, background: 'var(--primary-soft)', borderRadius: 'var(--r-xl)', textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--primary)', marginBottom: 5 }}>Interview Completed!</h3>
                        <p style={{ color: 'var(--text-main)', fontWeight: 600 }}>Overall Score: {currentInterview.overallScore.toFixed(1)} / 10</p>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default MockInterview;
