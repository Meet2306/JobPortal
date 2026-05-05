import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import '../auth.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, ArrowRight, ArrowLeft, Mail, Lock,
  ShieldCheck, GraduationCap, AlertCircle, CheckCircle
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   ANIMATION CONFIG
═══════════════════════════════════════════════════════════════ */
const ease = [0.25, 0.1, 0.25, 1];
const fieldContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};
const fieldItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease } }
};
const formSwitch = {
  enter: { opacity: 0, x: 14 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.22, ease } }
};

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════════ */
function FloatInput({ label, type = 'text', value, onChange, required, autoComplete, prefix, maxLength }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPass = type === 'password';
  const t = isPass ? (show ? 'text' : 'password') : type;
  return (
    <div className="relative">
      <motion.input
        type={t} value={value} onChange={onChange}
        required={required} autoComplete={autoComplete}
        placeholder=" " maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="auth-input-field w-full"
        style={{ paddingLeft: prefix ? '2.6rem' : '1rem', paddingRight: isPass ? '2.5rem' : '1rem' }}
        whileFocus={{ scale: 1.005 }} transition={{ duration: 0.14 }}
      />
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
          style={{ color: focused ? '#4f46e5' : '#cbd5e1' }}>
          {prefix}
        </span>
      )}
      <label className="auth-label" style={{ left: prefix ? '2.6rem' : '1rem' }}>{label}</label>
      {isPass && (
        <motion.button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 p-1 transition-colors"
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </motion.button>
      )}
    </div>
  );
}

function Alert({ type, msg }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease }}
          className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm font-medium leading-relaxed mb-4 overflow-hidden
            ${type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          {type === 'error'
            ? <AlertCircle size={15} className="mt-0.5 shrink-0" />
            : <CheckCircle size={15} className="mt-0.5 shrink-0" />}
          <span>{msg}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PrimaryBtn({ children, loading, disabled, type = 'submit', onClick }) {
  return (
    <motion.button type={type} onClick={onClick} disabled={disabled || loading}
      className="w-full flex items-center justify-center gap-2 rounded-xl font-bold text-sm text-white disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
      style={{ height: 50, background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
      whileHover={!disabled && !loading ? { y: -2, boxShadow: '0 8px 24px rgba(99,102,241,0.45)' } : {}}
      whileTap={!disabled && !loading ? { scale: 0.99 } : {}}
      transition={{ duration: 0.16, ease }}>
      <motion.div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent 60%)' }}
        initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} transition={{ duration: 0.2 }} />
      {loading
        ? <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </svg>
        : <span className="relative z-10 flex items-center gap-2">{children}</span>}
    </motion.button>
  );
}

function LeftImagePanel() {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center h-full relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 40%, #ede9fe 100%)' }}>

      {/* Decorative blobs (Identical to AuthPage) */}
      <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', width: 220, height: 220, borderRadius: '50%', background: 'rgba(139,92,246,0.08)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '35%', right: '8px', width: 110, height: 110, borderRadius: '50%', background: 'rgba(50,50,240,0.05)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '38%', left: '35%', width: 110, height: 110, borderRadius: '50%', background: 'rgba(50,50,240,0.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '32%', left: '43%', width: 110, height: 110, borderRadius: '50%', background: 'rgba(50,10,247,0.04)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-6%', left: '3%', width: 150, height: 150, borderRadius: '50%', background: 'rgba(45,45,450,0.07)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-6%', left: '-5%', width: 100, height: 100, borderRadius: '50%', background: 'rgba(54,70,246,0.1)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.7 }}
        style={{
          position: "absolute", left: "60px", top: "30%", transform: "translateY(-50%)",
          background: "rgba(255,255,255,0.3)", backdropFilter: "blur(10px)",
          padding: "28px 32px", borderRadius: "16px", maxWidth: "405px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)", border: "1px solid rgba(255,255,255,0.4)",
          fontFamily: "'Roboto', 'Poppins', 'Montserrat', 'Raleway', sans-serif"
        }}
      >
        <h2 style={{ 
            fontSize: "35px", fontWeight: "900", color: "#1e293b", 
            lineHeight: "1.2", marginBottom: "14px", letterSpacing: "0.5px" 
        }}>
          <strong>Admin Console</strong>
        </h2>
        <p style={{ 
            fontSize: "15px", color: "#1e293b", lineHeight: "1.8", 
            fontWeight: 500, letterSpacing: "0.3px",
            fontFamily: "'Poppins', 'Montserrat', 'Raleway', 'Roboto', 'Nunito', 'Inter', sans-serif"
        }}>
          Manage placements, verify users, and monitor portal analytics from your central dashboard.<br />
          The dedicated gateway for TPO staff and administrators.
        </p>
      </motion.div>

      <motion.div
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
        className="absolute bottom-[-7px] right-[-33px] z-10"
        style={{ maxWidth: 450 }}>
        <img
          src="/avatar-male.png"
          alt="Admin Illustration"
          style={{ 
            width: '100%', 
            objectFit: 'contain', 
            mixBlendMode: 'multiply', 
            filter: 'drop-shadow(0 28px 56px rgba(99,102,241,0.28))',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%)',
            maskImage: 'linear-gradient(to right, transparent 0%, black 5%)'
          }}
        />
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { user, loading, login } = useContext(AuthContext);

  useEffect(() => {
    if (!loading && user) {
        if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
        else navigate(`/${user.role}`, { replace: true });
    }
  }, [user, loading, navigate]);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true); setLoginError('');
    try {
      const res = await login(loginData);
      if (res.role !== 'admin') {
          setLoginError('Access denied. Please use the Student/Company portal.');
      } else {
          navigate('/admin/dashboard');
      }
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Incorrect admin credentials.');
    } finally { setLoginLoading(false); }
  };

  const l = (field) => (e) => setLoginData(p => ({ ...p, [field]: e.target.value }));

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row"
      style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#f8faff' }}>

      {/* LEFT — 60% Image Panel */}
      <div className="lg:w-[60%] w-full">
        <div className="hidden lg:block h-full">
          <LeftImagePanel />
        </div>
        {/* Mobile: image strip on top (Identical to AuthPage) */}
        <motion.div
          className="flex lg:hidden items-center justify-center py-6 px-4"
          style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f0f9ff 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}>
          <img src="/avatar-male.png" alt="Placement avatar"
            style={{
              maxWidth: 260, width: '100%',
              mixBlendMode: 'multiply',
              filter: 'drop-shadow(0 12px 24px rgba(99,102,241,0.22))'
            }} />
        </motion.div>
      </div>

      {/* RIGHT — 40% Form Panel */}
      <div className="lg:w-[40%] w-full flex items-center justify-center p-6 lg:p-10"
        style={{ background: '#ffffff', boxShadow: '-4px 0 32px rgba(0,0,0,0.05)', minHeight: '100vh' }}>

        <motion.div
          className="w-full"
          style={{ maxWidth: 420 }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.2 }}>

          {/* Logo (Identical to AuthPage) */}
          <motion.div className="flex items-center gap-3 mb-8 cursor-pointer" 
            onClick={() => navigate('/about')}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
              <GraduationCap size={22} color="white" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-800 leading-tight">PlacePortal</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Admin Portal</div>
            </div>
          </motion.div>

          <motion.div variants={fieldContainer} initial="hidden" animate="show">
            <motion.div variants={fieldItem} className="mb-7">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">Administrator Login</h2>
              <p className="text-sm text-slate-400">Authorized access only for TPO staff</p>
            </motion.div>

            <Alert type="error" msg={loginError} />

            <form onSubmit={handleLogin} className="space-y-4">
              <motion.div variants={fieldItem}>
                <FloatInput label="Email Address" type="email" value={loginData.email}
                  onChange={l('email')} required autoComplete="email"
                  prefix={<Mail size={15} />} />
              </motion.div>

              <motion.div variants={fieldItem}>
                <FloatInput label="Password" type="password" value={loginData.password}
                  onChange={l('password')} required autoComplete="current-password"
                  prefix={<Lock size={15} />} />
              </motion.div>

              <motion.div variants={fieldItem} className="flex justify-end">
                <button type="button" 
                    className="text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors group relative pb-0.5">
                    Forgot password?
                    <span className="absolute bottom-0 left-0 right-0 h-px bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                </button>
              </motion.div>

              <motion.div variants={fieldItem} className="pt-1">
                <PrimaryBtn loading={loginLoading}>
                  Sign In <ArrowRight size={16} />
                </PrimaryBtn>
              </motion.div>
            </form>

            <motion.div variants={fieldItem} className="mt-8 pt-6 border-t border-slate-100 text-center">
                <button 
                    onClick={() => navigate('/login')}
                    className="flex items-center justify-center gap-2 mx-auto text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                    <ArrowLeft size={14} /> Back to User Login
                </button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
