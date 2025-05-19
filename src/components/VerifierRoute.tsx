import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface VerifierRouteProps {
  children: React.ReactNode;
  requiresAdmin?: boolean;
}

/**
 * A route component that restricts access to users with verifier or admin roles
 */
const VerifierRoute: React.FC<VerifierRouteProps> = ({ 
  children, 
  requiresAdmin = false 
}) => {
  const { currentUser, loading, isVerifier, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Check if the user has the required role
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If admin is required, check for admin role
  if (requiresAdmin && !isAdmin()) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
        <p className="mb-6">You need administrator permissions to access this page.</p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  // If verifier role is required, check for verifier role
  if (!isVerifier()) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
        <p className="mb-6">You need ticket verifier permissions to access this page.</p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default VerifierRoute;
