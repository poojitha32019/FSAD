import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import './theme.css';
import { ThemeProvider } from './ThemeContext';
import HomePage from './components/HomePage';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [user, setUser] = useState(() => {
    // Restore user from sessionStorage so browser back button works
    try {
      const saved = sessionStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const navigate = useNavigate();

  const handleLogin = (userData) => {
    const u = { ...userData, id: userData.userId };
    setUser(u);
    sessionStorage.setItem('user', JSON.stringify(u));
    navigate(userData.role === 'student' ? '/student' : '/admin');
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  return (
    <ThemeProvider>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage onLogin={handleLogin} />} />
          <Route path="/student" element={user ? <StudentDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/admin" element={user ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </ThemeProvider>
  );
}

export default App;
