import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingScreen } from '../components/LoadingScreen';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen fullScreen={true} message="Verifying security credentials..." />;
  }

  if (!isAuthenticated) {
    const loginTarget = location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
    return <Navigate to={loginTarget} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If user doesn't have the required role, redirect to appropriate home or admin login
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
