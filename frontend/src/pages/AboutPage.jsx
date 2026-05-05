import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Building2, ShieldCheck, Brain, FileText,
  BarChart3, CheckCircle, Lock, Mail, ArrowRight, ChevronRight, User
} from 'lucide-react';

const AboutPage = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const containerStyle = {
    background: '#f8faff',
    minHeight: '100vh',
    color: '#1e293b',
    fontFamily: 'Inter, system-ui, sans-serif',
    overflowX: 'hidden'
  };

  const navStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 40px',
    borderBottom: '1px solid rgba(0,0,0,0.05)'
  };

  const heroStyle = {
    padding: '80px 20px',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 40%, #ede9fe 100%)',
    borderBottom: '1px solid rgba(0,0,0,0.05)'
  };

  const sectionStyle = {
    padding: '80px 20px',
    maxWidth: 1200,
    margin: '0 auto'
  };

  const cardStyle = (role, isHovered) => ({
    background: '#ffffff',
    border: `1px solid ${isHovered ? role.color : 'rgba(0,0,0,0.08)'}`,
    borderRadius: 16,
    padding: '28px 24px',
    flex: '1 1 300px',
    minWidth: 280,
    transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
    boxShadow: isHovered ? `0 12px 30px -10px ${role.color}40` : '0 4px 14px rgba(0,0,0,0.03)'
  });

  const roles = [
    {
      id: 'student',
      title: 'Student',
      subtitle: 'Campus Job Seeker',
      color: '#4F46E5',
      icon: GraduationCap,
      steps: [
        { title: 'Register & Verify Email', desc: 'Create your account and verify via email link' },
        { title: 'Wait for Admin Approval', desc: 'Account is locked until TPO approves' },
        { title: 'Complete Profile', desc: 'Fill education, skills, upload photo & resume' },
        { title: 'Browse Eligible Jobs', desc: 'View jobs filtered by eligibility criteria' },
        { title: 'Apply for Jobs', desc: 'Submit applications to open positions' },
        { title: 'Track Applications', desc: 'Monitor status: Applied → Selected' },
        { title: 'AI Mock Interview', desc: 'Practice with AI-generated questions' },
        { title: 'AI Resume Scanner (ATS)', desc: 'Evaluate resume against descriptions' }
      ]
    },
    {
      id: 'company',
      title: 'Company',
      subtitle: 'Recruiter / Employer',
      color: '#059669',
      icon: Building2,
      steps: [
        { title: 'Register & Verify Email', desc: 'Create account and verify email' },
        { title: 'Wait for Admin Approval', desc: 'Account is pending until TPO verifies' },
        { title: 'Complete Company Profile', desc: 'Fill company details and HR contact' },
        { title: 'Post Job Listings', desc: 'Add job title, package, and criteria' },
        { title: 'Wait for Job Approval', desc: 'Admin must approve each job before it goes live' },
        { title: 'View Applicants', desc: 'See students who applied to approved jobs' },
        { title: 'Manage Applications', desc: 'Update statuses: Shortlist, Select, Reject' },
        { title: 'Request Profile Edit', desc: 'Request admin permission to edit locked profile' }
      ]
    },
    {
      id: 'admin',
      title: 'Admin (TPO)',
      subtitle: 'Placement Officer',
      color: '#D97706',
      icon: ShieldCheck,
      steps: [
        { title: 'Login', desc: 'Pre-created admin account bypasses verification' },
        { title: 'Review Pending Users', desc: 'See all unverified students and companies' },
        { title: 'Approve or Reject Users', desc: 'Verify legitimate accounts; reject spam' },
        { title: 'Approve Job Postings', desc: 'Review company listings before they go live' },
        { title: 'Handle Edit Requests', desc: 'Grant or deny profile edit permissions' },
        { title: 'Monitor Analytics', desc: 'View platform stats: total users, placements' },
        { title: 'Full Access Override', desc: 'Bypasses role checks and controls pipeline' }
      ]
    }
  ];

  const features = [
    { icon: Brain, title: 'AI Mock Interview', desc: 'Practice interviews with AI-generated questions tailored to your skills' },
    { icon: FileText, title: 'ATS Resume Scanner', desc: 'Get your resume scored against real job descriptions' },
    { icon: Lock, title: 'Role-Based Security', desc: 'Every action is protected by role and verification middleware' },
    { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Admin gets real-time insights on placement performance' },
    { icon: CheckCircle, title: 'Approval Pipeline', desc: 'Multi-step verification ensures quality of students and job postings' },
    { icon: Mail, title: 'Email Notifications', desc: 'Automated emails for verification, password reset, and updates' }
  ];

  return (
    <div style={containerStyle}>
      {/* Navbar */}
      <nav style={navStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ background: '#4F46E5', borderRadius: 8, padding: 6, display: 'flex' }}>
            <GraduationCap size={20} color="white" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '0.5px' }}>PlacePortal</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button 
            style={{ 
              background: 'transparent', border: '2px solid rgba(79,70,229,0.2)', 
              color: '#4F46E5', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700
            }}
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button 
            style={{ 
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', border: 'none', 
              color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)'
            }}
            onClick={() => navigate('/register')}
          >
            Register
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={heroStyle}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {roles.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', padding: '6px 16px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <r.icon size={16} color={r.color} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>{r.title}</span>
            </div>
          ))}
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, marginBottom: 16, letterSpacing: '-0.5px', color: '#1e293b' }}>How Our Platform Works</h1>
        <p style={{ fontSize: 'clamp(16px, 2vw, 18px)', color: '#64748b', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          A role-based placement portal connecting Students, Companies, and Administrators
        </p>
      </header>

      {/* Roles Section */}
      <section style={sectionStyle}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, color: '#1e293b' }}>Role Workflows</h2>
          <p style={{ color: '#64748b' }}>Understanding the responsibilities and permissions of each user type.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'stretch' }}>
          {roles.map((role) => (
            <div 
              key={role.id}
              style={cardStyle(role, hoveredCard === role.id)}
              onMouseEnter={() => setHoveredCard(role.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `${role.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <role.icon size={22} color={role.color} />
                </div>
                <div>
                  <h3 style={{ color: '#1e293b', fontWeight: 800, fontSize: 18, margin: 0 }}>{role.title}</h3>
                  <p style={{ color: '#64748b', fontSize: 13, margin: 0, fontWeight: 600 }}>{role.subtitle}</p>
                </div>
              </div>
              
              <div>
                {role.steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: role.color, color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2,
                      boxShadow: `0 2px 8px ${role.color}40`
                    }}>
                      {i + 1}
                    </div>
                    <div>
                      <p style={{ color: '#334155', fontWeight: 700, fontSize: 13, margin: '0 0 4px' }}>{step.title}</p>
                      <p style={{ color: '#64748b', fontSize: 12, margin: 0, lineHeight: 1.4 }}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Flow Diagram */}
      <section style={{ ...sectionStyle, borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)', background: '#ffffff' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>End-to-End Pipeline</h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxWidth: 600, margin: '0 auto' }}>
          {[
            { text: 'Student & Company Register', color: '#64748b', bg: '#f8fafc' },
            { text: 'Admin Reviews & Approves Users', color: '#D97706', bg: '#fffbeb' },
            { text: 'Company Posts Job → Admin Approves Job', color: '#059669', bg: '#ecfdf5' },
            { text: 'Student Applies to Live Jobs', color: '#4F46E5', bg: '#eef2ff' },
            { text: 'Company Reviews → Updates Status', color: '#059669', bg: '#ecfdf5' },
            { text: 'Student Gets Placed 🎉', color: '#4F46E5', bg: '#eef2ff', isLast: true }
          ].map((item, i) => (
            <React.Fragment key={i}>
              <div style={{ 
                background: item.bg, 
                border: `1px solid ${item.color}40`,
                padding: '16px 24px', borderRadius: 12,
                width: '100%', textAlign: 'center',
                fontWeight: 700, fontSize: 14, color: item.color,
                boxShadow: `0 4px 14px -5px ${item.color}20`
              }}>
                {item.text}
              </div>
              {!item.isLast && <div style={{ height: 24, width: 2, background: 'rgba(0,0,0,0.1)' }}></div>}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section style={sectionStyle}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, color: '#1e293b' }}>Platform Highlights</h2>
          <p style={{ color: '#64748b' }}>Built with modern technologies to streamline the placement process.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {features.map((f, i) => (
            <div key={i} style={{ 
              background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)',
              padding: 24, borderRadius: 16, display: 'flex', gap: 16,
              boxShadow: '0 4px 14px rgba(0,0,0,0.02)'
            }}>
              <div style={{ 
                width: 40, height: 40, borderRadius: 10, background: '#f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                border: '1px solid rgba(0,0,0,0.05)'
              }}>
                <f.icon size={20} color="#64748b" />
              </div>
              <div>
                <h4 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px', color: '#334155' }}>{f.title}</h4>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ ...sectionStyle, textAlign: 'center', paddingBottom: 100 }}>
        <div style={{ 
          background: '#ffffff',
          border: '1px solid rgba(79,70,229,0.15)',
          borderRadius: 24, padding: '48px 24px',
          boxShadow: '0 10px 40px -10px rgba(79,70,229,0.1)'
        }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, color: '#1e293b' }}>Ready to join?</h2>
          <p style={{ color: '#64748b', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
            Start your journey today. Create an account to access the Campus Placement Portal.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button 
              onMouseEnter={() => setHoveredBtn('register')}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={() => navigate('/register')}
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', color: 'white', border: 'none',
                padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                transition: 'transform 0.2s',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                transform: hoveredBtn === 'register' ? 'translateY(-2px)' : 'none'
              }}
            >
              Get Started <ArrowRight size={16} />
            </button>
            <button 
              onMouseEnter={() => setHoveredBtn('login')}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={() => navigate('/login')}
              style={{
                background: 'transparent', color: '#4f46e5', border: '2px solid rgba(79,70,229,0.2)',
                padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                transition: 'border-color 0.2s',
                ...(hoveredBtn === 'login' ? { borderColor: '#4f46e5' } : {})
              }}
            >
              <User size={16} /> Login
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 20px', textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.05)', background: '#f1f5f9' }}>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 12px' }}>&copy; 2026 Campus Placement Portal. All rights reserved.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Admin Portal</button>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <button style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Support</button>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
