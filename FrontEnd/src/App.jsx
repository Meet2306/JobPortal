<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Context for auth state
import { createContext, useContext } from 'react';

// Pages/Components (to be created)
import Login from './pages/Login';
import RegisterStudent from './pages/RegisterStudent';
import RegisterCompany from './pages/RegisterCompany';
import StudentDashboard from './pages/StudentDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

// Auth Context
export const AuthContext = createContext();

const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in (from localStorage)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, useAuth }}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register/student" element={<RegisterStudent />} />
          <Route path="/register/company" element={<RegisterCompany />} />

          {/* Student Routes */}
          {user?.role === 'student' && (
            <Route path="/student/*" element={<StudentDashboard />} />
          )}

          {/* Company Routes */}
          {user?.role === 'company' && (
            <Route path="/company/*" element={<CompanyDashboard />} />
          )}

          {/* Admin Routes */}
          {user?.role === 'admin' && (
            <Route path="/admin/*" element={<AdminDashboard />} />
          )}

          {/* Home/Default Route */}
          <Route
            path="/"
            element={
              user ? (
                user.role === 'student' ? (
                  <Navigate to="/student" />
                ) : user.role === 'company' ? (
                  <Navigate to="/company" />
                ) : (
                  <Navigate to="/admin" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
=======
import Dashboard from './components/Dashboard'

function App() {
  return (
    <Dashboard />
  )
>>>>>>> dbe18fdf0e62e3af32d2144ba06a63a06328a542
}

export default App;

