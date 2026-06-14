import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Route protection wrapper enforcing authentication and role-based permissions
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-100 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-purple-600 border-r-indigo-500 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-slate-500 font-bold tracking-wide animate-pulse">Establishing secure environment...</p>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`[RBAC WARNING] Unauthorized client route request: Role '${user.role}' attempting to reach restricted route.`);
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
