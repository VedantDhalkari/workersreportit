import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Create a single axios instance pointing at your backend
const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL + '/api',
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Set token in axios and localStorage
  const setToken = token => {
    if (token) {
      API.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem('report-it-token', token);
    } else {
      delete API.defaults.headers.common.Authorization;
      localStorage.removeItem('report-it-token');
    }
  };

  // Load user from saved token and validate with /auth/me
  useEffect(() => {
    const savedToken = localStorage.getItem('report-it-token');

    if (savedToken) {
      setToken(savedToken);
      API.get('/auth/me')
        .then(res => {
          const freshUser = res.data.user;
          setUser(freshUser);
          localStorage.setItem('report-it-user', JSON.stringify(freshUser)); // ✅ update user data with latest role
        })
        .catch(() => {
          setUser(null);
          setToken(null);
          localStorage.removeItem('report-it-user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Login: store token + user
  const login = async (email, password) => {
    try {
      const { data } = await API.post('/auth/login', { email, password });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('report-it-user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.msg || 'Login failed';
      throw new Error(msg);
    }
  };

  // Signup: basic redirection after success
  const signup = async info => {
    await API.post('/auth/signup', info);
    navigate('/login');
  };

  // Logout: nuke everything
  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (err) {
      console.warn('Logout failed:', err);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('report-it-user');
    navigate('/login');
  };

  // Context value exposed to app
  const value = { user, login, signup, logout, loading };

  // Show loading screen while verifying token
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl font-medium">
        Loading…
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Export API instance too
export { API };
