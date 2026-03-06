import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import '../auth.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, ArrowRight, ArrowLeft, Check, RefreshCw,
  AlertCircle, CheckCircle, User, Building2, Mail, Lock,
  Phone, Globe, ChevronRight, GraduationCap
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   ANIMATION CONFIG
═══════════════════════════════════════════════════════════════ */
const ease = [0.25, 0.1, 0.25, 1];

const fieldContainer = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};
const fieldItem = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y:  0, transition: { duration: 0.35, ease } }
};
const formSwitch = {
  enter: { opacity: 0, x:  14 },
  show:  { opacity: 1, x:   0, transition: { duration: 0.35, ease } },
  exit:  { opacity: 0, x: -10, transition: { duration: 0.22, ease } }
};

/* ═══════════════════════════════════════════════════════════════
   STEP CONFIG
═══════════════════════════════════════════════════════════════ */
const REG_STEPS = [
  { id: 1, label: 'Account Type', short: 'Type'   },
  { id: 2, label: 'Credentials',  short: 'Login'  },
  { id: 3, label: 'Profile',      short: 'Info'   },
  { id: 4, label: 'Verification', short: 'Verify' },
];

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════════ */
function FloatInput({ label, type = 'text', value, onChange, required, autoComplete, prefix, maxLength }) {
  const [show, setShow]       = useState(false);
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

function FloatSelect({ label, value, onChange, options, required }) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange} required={required}
        className="auth-input-field w-full appearance-none cursor-pointer pr-8"
        style={{ color: value ? '#0f172a' : 'transparent' }}>
        <option value=""> </option>
        {options.map(o => <option key={o} value={o} style={{ color: '#0f172a' }}>{o}</option>)}
      </select>
      <label className="auth-label">{label}</label>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
        <ChevronRight size={14} className="rotate-90" />
      </span>
    </div>
  );
}

function StepBar({ current }) {
  return (
    <div className="flex items-center w-full mb-6">
      {REG_STEPS.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center gap-1 shrink-0">
            <motion.div
              className={`step-dot ${current > s.id ? 'done' : current === s.id ? 'active' : 'pending'}`}
              animate={{ scale: current === s.id ? 1.1 : 1 }}
              transition={{ duration: 0.25 }}>
              <AnimatePresence mode="wait">
                {current > s.id
                  ? <motion.span key="chk" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
                      <Check size={13} />
                    </motion.span>
                  : <motion.span key={s.id}>{s.id}</motion.span>}
              </AnimatePresence>
            </motion.div>
            <span className={`text-[9px] font-bold uppercase tracking-wider hidden sm:block transition-colors duration-300 ${current >= s.id ? 'text-slate-700' : 'text-slate-300'}`}>
              {s.short}
            </span>
          </div>
          {i < REG_STEPS.length - 1 && (
            <div className="flex-1 h-0.5 mx-1 overflow-hidden rounded-full bg-slate-200">
              <motion.div className="h-full bg-indigo-600 rounded-full"
                initial={{ scaleX: 0 }} animate={{ scaleX: current > s.id ? 1 : 0 }}
                transition={{ duration: 0.4, ease }} style={{ transformOrigin: 'left' }} />
            </div>
          )}
        </React.Fragment>
      ))}
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
            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        : <span className="relative z-10 flex items-center gap-2">{children}</span>}
    </motion.button>
  );
}

function OutlineBtn({ children, onClick }) {
  return (
    <motion.button type="button" onClick={onClick}
      className="flex-1 h-[50px] rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-500 flex items-center justify-center gap-2"
      whileHover={{ borderColor: '#6366f1', color: '#4f46e5', y: -1 }}
      whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
      {children}
    </motion.button>
  );
}

function OTPDisplay({ email, onBack }) {
  return (
    <motion.div className="text-center" variants={fieldContainer} initial="hidden" animate="show">
      <motion.div variants={fieldItem}
        className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-4">
        <Mail size={28} className="text-emerald-500" />
      </motion.div>
      <motion.h2 variants={fieldItem} className="text-xl font-bold text-slate-800 mb-2">Verify your email</motion.h2>
      <motion.p variants={fieldItem} className="text-sm text-slate-500 mb-5 leading-relaxed">
        A verification link was sent to<br /><strong className="text-slate-700">{email}</strong>
      </motion.p>
      <motion.div variants={fieldItem} className="flex justify-center gap-2.5 mb-5">
        {[...Array(6)].map((_, i) => (
          <motion.div key={i}
            className="w-9 h-11 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center text-base font-bold text-slate-300"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.05, duration: 0.28, ease }}>•</motion.div>
        ))}
      </motion.div>
      <motion.div variants={fieldItem} className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-left mb-5">
        <p className="text-xs font-bold text-blue-700 mb-1">Didn't receive it?</p>
        <p className="text-xs text-blue-600 leading-relaxed">Check your spam folder, or <span className="font-bold underline cursor-pointer">resend the link</span>.</p>
      </motion.div>
      <motion.button variants={fieldItem} onClick={onBack}
        className="flex items-center gap-2 mx-auto text-sm font-semibold text-slate-400 hover:text-indigo-600 transition-colors">
        <ArrowLeft size={15} /> Back to Sign In
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RIGHT PANEL — Avatar Image (slides in from right)
═══════════════════════════════════════════════════════════════ */
function LeftImagePanel() {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center h-full relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 40%, #ede9fe 100%)' }}>

      {/* Decorative blobs */}
      <div style={{ position:'absolute', top:'-60px', left:'-60px', width:300, height:300,
        borderRadius:'50%', background:'rgba(99,102,241,0.08)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-40px', right:'-40px', width:220, height:220,
        borderRadius:'50%', background:'rgba(139,92,246,0.07)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:'35%', right:'8px', width:110, height:110,
        borderRadius:'50%', background:'rgba(59,130,246,0.055)', pointerEvents:'none' }} />

      {/* Avatar image — slides in from LEFT after 1s delay */}
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.8, ease: 'easeOut' }}
        className="relative z-10"
        style={{ width:'100%', maxWidth:520, padding:'0 24px' }}>
        <img
          src="/avatar-male.png"
          alt="Student working on laptop"
          style={{
            width: '100%',
            objectFit: 'contain',
            mixBlendMode: 'multiply',
            filter: 'drop-shadow(0 28px 56px rgba(99,102,241,0.28))'
          }}
        />
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN AUTH PAGE — 40% Form LEFT | 60% Image RIGHT
═══════════════════════════════════════════════════════════════ */
export default function AuthPage({ initialMode }) {
  const location  = useLocation();
  const startMode = initialMode || (location.pathname === '/register' ? 'register' : 'login');
  const [mode, setMode]     = useState(startMode);
  const navigate            = useNavigate();
  const { user, loading, login, register } = useContext(AuthContext);

  useEffect(() => {
    if (!loading && user) {
      navigate(`/${user.role}`, { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return null; // Or a sleek loader, but null is fine to avoid flash

  const switchMode = (to) => {
    setMode(to);
    navigate(to === 'login' ? '/login' : '/register', { replace: true });
  };

  /* -- Login state -- */
  const [loginData,    setLoginData]    = useState({ email: '', password: '' });
  const [loginError,   setLoginError]   = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true); setLoginError('');
    try {
      const data = await login(loginData);
      navigate(`/${data.role}`);
    } catch (err) {
      const msg = err.response?.data?.error || '';
      setLoginError(msg.toLowerCase().includes('verify')
        ? 'Please verify your email before signing in.'
        : msg || 'Incorrect email or password.');
    } finally { setLoginLoading(false); }
  };

  /* -- Register state -- */
  const [step,       setStep]       = useState(1);
  const [regDir,     setRegDir]     = useState(1);
  const [registered, setRegistered] = useState(false);
  const [regData,    setRegData]    = useState({
    role: 'student', email: '', password: '', confirmPassword: '',
    name: '', contactNumber: '',
    companyName: '', industry: '', websiteUrl: '', captcha: ''
  });
  const [captchaSvg,     setCaptchaSvg]     = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [regError,  setRegError]  = useState('');
  const [regLoading,setRegLoading]= useState(false);

  const refreshCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    try {
      const res = await api.get('/auth/captcha');
      setCaptchaSvg(res.data);
      setRegData(p => ({ ...p, captcha: '' }));
    } catch { setRegError('Security image failed. Please try again.'); }
    finally { setCaptchaLoading(false); }
  }, []);

  useEffect(() => {
    if (mode === 'register' && step === 4 && !captchaSvg) refreshCaptcha();
  }, [mode, step]);

  const nextStep = () => {
    setRegError('');
    if (step === 2) {
      if (!regData.email.includes('@')) return setRegError('Please enter a valid email address.');
      if (regData.password.length < 8)  return setRegError('Password must be at least 8 characters.');
      if (regData.password !== regData.confirmPassword) return setRegError('Passwords do not match.');
    }
    if (step === 3) {
      if (regData.role === 'student') {
        if (!regData.name || !regData.contactNumber)
          return setRegError('Full name and contact number are required.');
        
        const phoneRegex = /^[789]\d{9}$/;
        if (!phoneRegex.test(regData.contactNumber)) {
          return setRegError('Please enter a valid 10-digit mobile number starting with 7, 8, or 9.');
        }
      }
      if (regData.role === 'company' && (!regData.companyName || !regData.industry))
        return setRegError('Company name and industry are required.');
    }
    setRegDir(1); setStep(s => s + 1);
  };
  const prevStep = () => { setRegError(''); setRegDir(-1); setStep(s => s - 1); };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regData.captcha) return setRegError('Please enter the captcha code.');
    setRegLoading(true); setRegError('');
    try {
      await register(regData);
      setRegistered(true);
    } catch (err) {
      refreshCaptcha();
      setRegError(err.response?.data?.error || 'Registration failed. Please check all fields.');
    } finally { setRegLoading(false); }
  };

  const r = (field) => (e) => setRegData(p => ({ ...p, [field]: e.target.value }));
  const l = (field) => (e) => setLoginData(p => ({ ...p, [field]: e.target.value }));

  /* --- RENDER --- */
  return (
    <div className="min-h-screen flex flex-col lg:flex-row"
      style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#f8faff' }}>

      {/* LEFT — 60% Image Panel */}
      <div className="lg:w-[60%] w-full">
        {/* Mobile: image strip on top */}
        <motion.div
          className="flex lg:hidden items-center justify-center py-6 px-4"
          style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f0f9ff 100%)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}>
          <img src="/avatar-male.png" alt="Placement avatar"
            style={{ maxWidth: 260, width: '100%',
              mixBlendMode: 'multiply',
              filter: 'drop-shadow(0 12px 24px rgba(99,102,241,0.22))' }} />
        </motion.div>
        {/* Desktop: full left panel */}
        <div className="hidden lg:block h-full">
          <LeftImagePanel />
        </div>
      </div>

      {/* RIGHT — 40% Form Panel */}
      <div className="lg:w-[40%] w-full flex items-center justify-center p-6 lg:p-10"
        style={{ background: '#ffffff', boxShadow: '-4px 0 32px rgba(0,0,0,0.05)', minHeight: '100vh' }}>

        {/* Card fades up on load */}
        <motion.div
          className="w-full"
          style={{ maxWidth: 420 }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.2 }}>

          {/* Logo */}
          <motion.div className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4, ease: 'easeOut' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
              <GraduationCap size={22} color="white" />
            </div>
            <div>
              <div className="text-base font-bold text-slate-800 leading-tight">PlacePortal</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Student Placement Portal</div>
            </div>
          </motion.div>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {mode === 'login' && !registered && (
              <motion.div key="login" variants={formSwitch} initial="enter" animate="show" exit="exit">
                <LoginPanel
                  data={loginData}
                  onChange={l}
                  onSubmit={handleLogin}
                  error={loginError}
                  loading={loginLoading}
                  onSwitch={() => switchMode('register')}
                />
              </motion.div>
            )}

            {mode === 'register' && !registered && (
              <motion.div key="register" variants={formSwitch} initial="enter" animate="show" exit="exit">
                <RegisterPanel
                  step={step} dir={regDir}
                  data={regData} onChange={r} setData={setRegData}
                  onNext={nextStep} onPrev={prevStep}
                  onSubmit={handleRegister}
                  error={regError} loading={regLoading}
                  captchaSvg={captchaSvg}
                  captchaLoading={captchaLoading}
                  refreshCaptcha={refreshCaptcha}
                />
              </motion.div>
            )}

            {registered && (
              <motion.div key="otp" variants={formSwitch} initial="enter" animate="show" exit="exit">
                <OTPDisplay email={regData.email}
                  onBack={() => {
                    setRegistered(false); setStep(1);
                    setRegData({ role:'student', email:'', password:'', confirmPassword:'', name:'', contactNumber:'', companyName:'', industry:'', websiteUrl:'', captcha:'' });
                    switchMode('login');
                  }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mode switcher footer */}
          <AnimatePresence>
            {!registered && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ delay: 0.5, duration: 0.35 }}
                className="text-center text-sm text-slate-400 mt-6 pt-5 border-t border-slate-100">
                {mode === 'login'
                  ? <>Don't have an account?{' '}
                      <button onClick={() => switchMode('register')}
                        className="text-indigo-600 font-bold hover:underline transition-all">
                        Create account
                      </button></>
                  : <>Already registered?{' '}
                      <button onClick={() => switchMode('login')}
                        className="text-indigo-600 font-bold hover:underline transition-all">
                        Sign in
                      </button></>}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   LOGIN PANEL
═══════════════════════════════════════════════════════════════ */
function LoginPanel({ data, onChange, onSubmit, error, loading, onSwitch }) {
  const [fpOpen,  setFpOpen]  = useState(false);
  const [fpEmail, setFpEmail] = useState(data.email || '');
  const [fpMsg,   setFpMsg]   = useState({ t: '', m: '' });
  const [fpLoad,  setFpLoad]  = useState(false);

  const sendReset = async (e) => {
    e.preventDefault(); setFpLoad(true);
    try {
      await api.post('/auth/forgot-password', { email: fpEmail });
      setFpMsg({ t: 'ok', m: 'Reset link sent. Check your inbox!' });
      setTimeout(() => { setFpOpen(false); setFpMsg({ t:'',m:'' }); }, 3500);
    } catch (err) {
      setFpMsg({ t: 'err', m: err.response?.data?.error || 'Could not send reset link.' });
    } finally { setFpLoad(false); }
  };

  return (
    <motion.div variants={fieldContainer} initial="hidden" animate="show">
      <motion.div variants={fieldItem} className="mb-7">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">Welcome back</h2>
        <p className="text-sm text-slate-400">Sign in to access your dashboard</p>
      </motion.div>

      <Alert type="error" msg={error} />

      <form onSubmit={onSubmit} className="space-y-4">
        <motion.div variants={fieldItem}>
          <FloatInput label="Email Address" type="email" value={data.email}
            onChange={onChange('email')} required autoComplete="email"
            prefix={<Mail size={15} />} />
        </motion.div>

        <motion.div variants={fieldItem}>
          <FloatInput label="Password" type="password" value={data.password}
            onChange={onChange('password')} required autoComplete="current-password"
            prefix={<Lock size={15} />} />
        </motion.div>

        <motion.div variants={fieldItem} className="flex justify-end">
          <button type="button" onClick={() => setFpOpen(o => !o)}
            className="text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors group relative pb-0.5">
            Forgot password?
            <span className="absolute bottom-0 left-0 right-0 h-px bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
          </button>
        </motion.div>

        <AnimatePresence>
          {fpOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease }}
              className="overflow-hidden">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Reset Password</p>
                {fpMsg.m && <p className={`text-xs font-medium mb-2 ${fpMsg.t==='ok'?'text-emerald-600':'text-red-600'}`}>{fpMsg.m}</p>}
                <div className="flex gap-2">
                  <input type="email" required placeholder="Your email"
                    value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        sendReset(e);
                      }
                    }}
                    className="flex-1 h-10 px-3 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-400 transition-colors"
                    style={{ fontFamily: 'Inter, sans-serif' }} />
                  <motion.button type="button" disabled={fpLoad} onClick={sendReset}
                    className="h-10 px-4 rounded-lg text-sm font-bold text-white disabled:opacity-60"
                    style={{ background: '#4f46e5' }}
                    whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.97 }}>
                    {fpLoad ? '...' : 'Send'}
                  </motion.button>
                </div>
                <button type="button" onClick={() => setFpOpen(false)}
                  className="mt-2 text-[11px] text-slate-400 hover:text-slate-600 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Back
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={fieldItem} className="pt-1">
          <PrimaryBtn loading={loading}>
            Sign In <ArrowRight size={16} />
          </PrimaryBtn>
        </motion.div>
      </form>

      <motion.div variants={fieldItem} className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-[11px] text-slate-300 font-medium tracking-widest">OR</span>
        <div className="flex-1 h-px bg-slate-100" />
      </motion.div>

      <motion.button variants={fieldItem} onClick={onSwitch}
        className="w-full h-[46px] rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-500 flex items-center justify-center gap-2 hover:border-indigo-400 hover:text-indigo-600 transition-all duration-200"
        whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.14 }}>
        <UserPlusIcon size={15} /> Create New Account
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REGISTER PANEL
═══════════════════════════════════════════════════════════════ */
function RegisterPanel({ step, dir, data, onChange, setData, onNext, onPrev, onSubmit, error, loading, captchaSvg, captchaLoading, refreshCaptcha }) {
  const stepAnim = {
    initial: { opacity: 0, x: dir * 22 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: dir * -16 },
    transition: { duration: 0.3, ease }
  };

  return (
    <motion.div variants={fieldContainer} initial="hidden" animate="show">
      <motion.div variants={fieldItem} className="mb-5">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">Create Account</h2>
        <p className="text-sm text-slate-400">Step {step} of {REG_STEPS.length} — {REG_STEPS[step-1].label}</p>
      </motion.div>
      <motion.div variants={fieldItem}><StepBar current={step} /></motion.div>
      <Alert type="error" msg={error} />

      <AnimatePresence mode="wait">
        {/* Step 1: Account Type */}
        {step === 1 && (
          <motion.div key="s1" {...stepAnim} className="space-y-4">
            <p className="text-sm font-semibold text-slate-600 mb-4">I am joining as a…</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { v: 'student', Icon: GraduationCap, l: 'Student',   sub: 'Looking for placement' },
                { v: 'company', Icon: Building2,     l: 'Recruiter', sub: 'Hiring top talent'      },
              ].map(({ v, Icon, l, sub }, i) => (
                <motion.button key={v} type="button"
                  onClick={() => setData(p => ({ ...p, role: v }))}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${data.role === v ? 'text-white border-indigo-500' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                  style={data.role === v ? { background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' } : {}}
                  whileHover={data.role !== v ? { borderColor: '#c7d2fe', y: -2 } : { y: -2 }}
                  whileTap={{ scale: 0.98 }} transition={{ duration: 0.14 }}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.04 * i, duration: 0.28 } }}>
                  <Icon size={24} />
                  <div className="text-center">
                    <div className="font-bold text-sm">{l}</div>
                    <div className={`text-[11px] ${data.role === v ? 'text-indigo-200' : 'text-slate-400'}`}>{sub}</div>
                  </div>
                </motion.button>
              ))}
            </div>
            <PrimaryBtn type="button" onClick={onNext}>Continue <ArrowRight size={16} /></PrimaryBtn>
          </motion.div>
        )}

        {/* Step 2: Credentials */}
        {step === 2 && (
          <motion.form key="s2" {...stepAnim} onSubmit={e => { e.preventDefault(); onNext(); }} className="space-y-4">
            <FloatInput label="Email Address" type="email" value={data.email}
              onChange={onChange('email')} required prefix={<Mail size={15} />} />
            <FloatInput label="Password (min. 8 characters)" type="password" value={data.password}
              onChange={onChange('password')} required prefix={<Lock size={15} />} />
            <FloatInput label="Confirm Password" type="password" value={data.confirmPassword}
              onChange={onChange('confirmPassword')} required prefix={<Lock size={15} />} />
            <AnimatePresence>
              {data.password.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                  className="flex gap-1.5 items-center">
                  {[1,2,3,4].map(i => {
                    const strength = data.password.length >= i * 3;
                    const color = data.password.length < 5 ? '#ef4444' : data.password.length < 9 ? '#f59e0b' : '#10b981';
                    return <motion.div key={i} className="h-1.5 flex-1 rounded-full"
                      animate={{ background: strength ? color : '#e2e8f0' }} transition={{ duration: 0.3 }} />;
                  })}
                  <span className="text-[11px] text-slate-400 font-semibold ml-1">
                    {data.password.length < 5 ? 'Weak' : data.password.length < 9 ? 'Fair' : data.password.length < 12 ? 'Good' : 'Strong'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex gap-3 pt-1">
              <OutlineBtn onClick={onPrev}><ArrowLeft size={15} /> Back</OutlineBtn>
              <div className="flex-1"><PrimaryBtn type="submit">Next <ArrowRight size={16} /></PrimaryBtn></div>
            </div>
          </motion.form>
        )}

        {/* Step 3: Profile */}
        {step === 3 && (
          <motion.form key="s3" {...stepAnim} onSubmit={e => { e.preventDefault(); onNext(); }} className="space-y-4">
            {data.role === 'student' ? (
              <>
                <FloatInput label="Full Name" value={data.name} onChange={onChange('name')} required prefix={<User size={15} />} />
                <FloatInput
                  label="Contact Number"
                  type="text"
                  value={data.contactNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    if (val.length <= 10) setData(p => ({ ...p, contactNumber: val }));
                  }}
                  maxLength="10"
                  required
                  prefix={<Phone size={15} />}
                />
              </>
            ) : (
              <>
                <FloatInput label="Company Name" value={data.companyName} onChange={onChange('companyName')} required prefix={<Building2 size={15} />} />
                <FloatSelect label="Industry Sector" value={data.industry} onChange={onChange('industry')} required
                  options={['Technology','Finance & Banking','Healthcare','Education','Manufacturing','Consulting','E-Commerce','Other']} />
                <FloatInput label="Company Website (optional)" type="url" value={data.websiteUrl} onChange={onChange('websiteUrl')} prefix={<Globe size={15} />} />
              </>
            )}
            <div className="flex gap-3 pt-1">
              <OutlineBtn onClick={onPrev}><ArrowLeft size={15} /> Back</OutlineBtn>
              <div className="flex-1"><PrimaryBtn type="submit">Next <ArrowRight size={16} /></PrimaryBtn></div>
            </div>
          </motion.form>
        )}

        {/* Step 4: Security Captcha */}
        {step === 4 && (
          <motion.form key="s4" {...stepAnim} onSubmit={onSubmit} className="space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security Verification</p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <motion.div className="flex-1 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={!captchaLoading ? refreshCaptcha : undefined}
                  whileHover={{ borderColor: '#6366f1' }} transition={{ duration: 0.15 }}>
                  {captchaLoading
                    ? <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.1)" strokeWidth="3"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="#6366f1" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                    : <div dangerouslySetInnerHTML={{ __html: captchaSvg }} style={{ height: 38 }} />}
                </motion.div>
                <motion.button type="button" onClick={refreshCaptcha}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400"
                  whileHover={{ borderColor: '#6366f1', color: '#6366f1', backgroundColor: '#eef2ff' }}
                  whileTap={{ scale: 0.95 }} transition={{ duration: 0.15 }}>
                  <RefreshCw size={15} className={captchaLoading ? 'animate-spin' : ''} />
                </motion.button>
              </div>
              <input placeholder="Enter the code shown above"
                value={data.captcha} onChange={onChange('captcha')} required
                className="w-full h-11 px-4 text-sm font-medium rounded-xl border border-slate-200 bg-white outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                style={{ fontFamily: 'Inter, sans-serif', color: '#0f172a', boxSizing: 'border-box' }} />
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              By creating an account you agree to our{' '}
              <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">Terms of Service</span>{' '}and{' '}
              <span className="text-indigo-600 font-semibold cursor-pointer hover:underline">Privacy Policy</span>.
            </p>
            <div className="flex gap-3">
              <OutlineBtn onClick={onPrev}><ArrowLeft size={15} /> Back</OutlineBtn>
              <div className="flex-1">
                <PrimaryBtn loading={loading}>{!loading && <><Check size={16} /> Create Account</>}</PrimaryBtn>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function UserPlusIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="19" y1="8" x2="19" y2="14"/>
      <line x1="22" y1="11" x2="16" y2="11"/>
    </svg>
  );
}
