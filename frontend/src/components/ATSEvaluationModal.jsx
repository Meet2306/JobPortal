import React, { useState, useEffect } from 'react';
import { X, Bot, Loader2, CheckCircle2, AlertCircle, TrendingUp, Briefcase } from 'lucide-react';
import api from '../utils/api';

const ATSEvaluationModal = ({ student, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    useEffect(() => {
        if (student) {
            evaluateStudent(student);
        }
    }, [student]);

    const evaluateStudent = async (std) => {
        setLoading(true);
        setError('');
        
        try {
            // Compile structured student data into a unified text format for the AI
            const resumeText = `
                Name: ${std.name || 'Unknown'}
                Email: ${std.emailAddress || 'Unknown'}
                Phone: ${std.contactNumber || 'Unknown'}
                Technical Skills: ${(std.skills?.technical || []).join(', ')}
                Soft Skills: ${(std.skills?.soft || []).join(', ')}
                Education: ${JSON.stringify(std.education || {})}
                Resume URL (for reference only): ${std.resumeUrl || 'None'}
            `.trim();

            const response = await api.post('/ats/evaluate-resume', { resumeText });
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to analyze resume. Make sure Gemini API Key is configured in the backend.');
        } finally {
            setLoading(false);
        }
    };

    if (!student) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ background: 'var(--purple-soft)', padding: 8, borderRadius: 'var(--r-lg)', color: 'var(--purple)' }}>
                            <Bot size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>AI ATS Evaluation</h2>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Candidate: {student.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                </div>

                <div style={{ padding: '24px', flex: 1 }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 16 }}>
                            <Loader2 size={40} className="animate-spin" color="var(--purple)" />
                            <div style={{ color: 'var(--text-sub)', fontWeight: 500 }}>Scanning Profile & Analyzing Skills...</div>
                        </div>
                    ) : error ? (
                        <div className="alert alert-error" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    ) : result ? (
                        <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            
                            {/* Score & ATS Compatibility container */}
                            <div className="grid-2" style={{ gap: 24 }}>
                                {/* Score Card */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '24px', background: 'linear-gradient(135deg, #f3e8ff 0%, #e0e7ff 100%)', borderRadius: 'var(--r-xl)' }}>
                                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                                        <span style={{ fontSize: 28, fontWeight: 900, color: result.ats_score >= 8 ? '#059669' : result.ats_score >= 5 ? '#D97706' : '#DC2626' }}>
                                            {result.ats_score}
                                        </span>
                                        <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 600 }}>/10</span>
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 4 }}>ATS Score</h3>
                                        <p style={{ fontSize: 14, color: '#4B5563', margin: 0 }}>Based on strict real-world ATS parser criteria.</p>
                                    </div>
                                </div>
                                {/* ATS Compatibility */}
                                <div style={{ padding: '24px', background: result.ats_compatibility?.is_ats_friendly ? '#F0FDF4' : '#FEF2F2', borderRadius: 'var(--r-xl)', border: `1px solid ${result.ats_compatibility?.is_ats_friendly ? '#BBF7D0' : '#FECACA'}` }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 800, color: result.ats_compatibility?.is_ats_friendly ? '#166534' : '#991B1B', marginBottom: 8 }}>
                                        ATS Friendly: {result.ats_compatibility?.is_ats_friendly ? 'Yes' : 'No'}
                                    </h3>
                                    {Array.isArray(result.ats_compatibility?.issues) && result.ats_compatibility.issues.length > 0 && (
                                        <ul style={{ paddingLeft: '20px', margin: 0, color: result.ats_compatibility?.is_ats_friendly ? '#15803D' : '#B91C1C', fontSize: 13 }}>
                                            {result.ats_compatibility.issues.map((issue, i) => <li key={i} style={{marginBottom: 4}}>{issue}</li>)}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Skills Row */}
                            <div className="grid-2" style={{ gap: 24 }}>
                                <div>
                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={16} color="var(--primary)" /> Technical Skills</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {Array.isArray(result.key_skills?.technical) ? result.key_skills.technical.map((skill, i) => (
                                            <span key={i} className="badge badge-primary" style={{ padding: '6px 12px' }}>{skill}</span>
                                        )) : <span className="text-muted">None extracted</span>}
                                    </div>
                                </div>
                                <div>
                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={16} color="var(--purple)" /> Soft Skills</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {Array.isArray(result.key_skills?.soft) ? result.key_skills.soft.map((skill, i) => (
                                            <span key={i} className="badge badge-purple" style={{ padding: '6px 12px' }}>{skill}</span>
                                        )) : <span className="text-muted">None extracted</span>}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#991B1B', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={16} color="#DC2626" /> Missing Important Keywords</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {Array.isArray(result.key_skills?.missing_important_keywords) ? result.key_skills.missing_important_keywords.map((skill, i) => (
                                        <span key={i} className="badge" style={{ padding: '6px 12px', background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}>{skill}</span>
                                    )) : <span className="text-muted" style={{fontSize: 14}}>None</span>}
                                </div>
                            </div>

                            {/* Section: Strengths & Weaknesses */}
                            <div className="grid-2" style={{ gap: 24 }}>
                                <div style={{ background: '#F0FDF4', padding: '20px', borderRadius: 'var(--r-lg)', border: '1px solid #BBF7D0' }}>
                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#166534', marginBottom: 12 }}>Key Strengths</h4>
                                    <ul style={{ paddingLeft: '20px', margin: 0, color: '#15803D', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {Array.isArray(result.strengths) ? result.strengths.map((str, i) => <li key={i}>{str}</li>) : null}
                                    </ul>
                                </div>
                                <div style={{ background: '#FEF2F2', padding: '20px', borderRadius: 'var(--r-lg)', border: '1px solid #FECACA' }}>
                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#991B1B', marginBottom: 12 }}>Honest Weaknesses (Missing Areas)</h4>
                                    <ul style={{ paddingLeft: '20px', margin: 0, color: '#B91C1C', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {Array.isArray(result.weaknesses) ? result.weaknesses.map((wk, i) => <li key={i}>{wk}</li>) : Array.isArray(result.weaknesses_or_missing_sections) ? result.weaknesses_or_missing_sections.map((wk, i) => <li key={i}>{wk}</li>) : null}
                                    </ul>
                                </div>
                            </div>

                            {/* Section-Wise Review */}
                            {result.section_wise_review && (
                                <div>
                                    <h4 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>Section-by-Section Review</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        {Object.entries(result.section_wise_review).map(([section, data]) => (
                                            <div key={section} style={{ background: '#F8FAFC', padding: '16px', borderRadius: 'var(--r-md)', border: '1px solid #E2E8F0' }}>
                                                <h5 style={{ textTransform: 'capitalize', fontSize: 14, fontWeight: 700, color: '#334155', margin: '0 0 8px 0' }}>{section}</h5>
                                                {Array.isArray(data?.issues) && data.issues.length > 0 && (
                                                    <div style={{ marginBottom: 8 }}>
                                                        <strong style={{ fontSize: 13, color: '#991B1B' }}>Issues:</strong>
                                                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#475569' }}>
                                                            {data.issues.map((is, i) => <li key={i}>{is}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                                {Array.isArray(data?.suggestions) && data.suggestions.length > 0 && (
                                                    <div>
                                                        <strong style={{ fontSize: 13, color: '#047857' }}>Suggestions:</strong>
                                                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#475569' }}>
                                                            {data.suggestions.map((su, i) => <li key={i}>{su}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Project Analysis & Bullet Point Improvements */}
                            {Array.isArray(result.bullet_point_improvements) && result.bullet_point_improvements.length > 0 && (
                                <div>
                                    <h4 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Bullet Point Improvements</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {result.bullet_point_improvements.map((bp, i) => (
                                            <div key={i} style={{ background: '#FFFBEB', padding: '16px', borderRadius: 'var(--r-md)', border: '1px solid #FEF3C7', fontSize: 13 }}>
                                                <div style={{ color: '#92400E', marginBottom: 8 }}><strong>Original:</strong> {bp.original}</div>
                                                <div style={{ color: '#065F46' }}><strong>Improved:</strong> {bp.improved}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {result.project_analysis && (
                                <div style={{ background: '#F0F9FF', padding: '20px', borderRadius: 'var(--r-lg)', border: '1px solid #BAE6FD', marginTop: 12 }}>
                                    <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0369A1', marginBottom: 12 }}>Project Analysis</h4>
                                    <p style={{ fontSize: 14, color: '#0C4A6E', margin: '0 0 12px 0' }}>{result.project_analysis.feedback}</p>
                                    <ul style={{ paddingLeft: '20px', margin: 0, color: '#0284C7', fontSize: 14 }}>
                                        {Array.isArray(result.project_analysis.suggestions) && result.project_analysis.suggestions.map((s, i) => <li key={i} style={{marginBottom: 4}}>{s}</li>)}
                                    </ul>
                                </div>
                            )}

                            {/* Job Roles */}
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Briefcase size={16} color="var(--warning)" /> Recommended Job Roles</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {Array.isArray(result.suitable_job_roles) && result.suitable_job_roles.map((role, i) => (
                                        <span key={i} className="badge badge-warning" style={{ padding: '6px 12px', fontSize: 13, fontWeight: 600 }}>{role}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Final Suggestions */}
                            <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: 'var(--r-lg)', border: '1px solid #E2E8F0' }}>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><TrendingUp size={16} color="#475569" /> Final Actionable Steps (to reach 8+/10)</h4>
                                <ul style={{ paddingLeft: '20px', margin: 0, color: '#475569', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {Array.isArray(result.final_suggestions) ? result.final_suggestions.map((imp, i) => <li key={i}>{imp}</li>) : Array.isArray(result.suggested_improvements) ? result.suggested_improvements.map((imp, i) => <li key={i}>{imp}</li>) : null}
                                </ul>
                            </div>

                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default ATSEvaluationModal;
