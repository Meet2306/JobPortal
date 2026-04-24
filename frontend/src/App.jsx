import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import AboutPage from './pages/AboutPage';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0a0f1e'
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid rgba(79,70,229,0.2)',
        borderTopColor: '#4f46e5',
        animation: 'spin 0.8s linear infinite'
      }} />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) {
    if (user.role === 'student') return <Navigate to="/student" />;
    if (user.role === 'company') return <Navigate to="/company" />;
    if (user.role === 'admin')   return <Navigate to="/admin" />;
  }
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"          element={<Navigate to="/about" />} />
          <Route path="/login"     element={<AuthPage initialMode="login" />} />
          <Route path="/register"  element={<AuthPage initialMode="register" />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token"   element={<VerifyEmail />} />
          <Route path="/about"     element={<AboutPage />} />
          <Route path="/student/*" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
          <Route path="/company/*" element={<PrivateRoute role="company"><CompanyDashboard /></PrivateRoute>} />
          <Route path="/admin/*"   element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
