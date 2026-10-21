import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Load current user profile from server if token exists
  const fetchCurrentUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data && res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn('Failed to fetch current user profile:', err?.response?.data?.message || err.message);
      // If invalid token, clear
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth-expired', handleExpired);
    return () => window.removeEventListener('auth-expired', handleExpired);
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data && res.data.success) {
      const { user: loggedInUser, token: authToken } = res.data;
      setUser(loggedInUser);
      setToken(authToken);
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      return loggedInUser;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const register = async (formData) => {
    const config =
      typeof FormData !== 'undefined' && formData instanceof FormData
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : {};
    const res = await api.post('/auth/register', formData, config);
    if (res.data && res.data.success) {
      const { user: registeredUser, token: authToken } = res.data;
      setUser(registeredUser);
      setToken(authToken);
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(registeredUser));
      return { ...registeredUser, devOtp: res.data?.devOtp, otpSent: res.data?.otpSent };
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  const updateUserData = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshUser: fetchCurrentUser,
    updateUserData,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isVendor: user?.role === 'vendor',
    isCustomer: user?.role === 'customer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
