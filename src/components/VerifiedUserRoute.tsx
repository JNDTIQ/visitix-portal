import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface VerifiedUserRouteProps {
  children: React.ReactNode;
}

const VerifiedUserRoute: React.FC<VerifiedUserRouteProps> = ({ children }) => {
  const { currentUser, verificationStatus } = useAuth();

  if (!currentUser) {
    // Redirect to login if user is not authenticated
    return <Navigate to="/login" replace />;
  }

  if (!verificationStatus.isVerified) {
    // Redirect to verification page if user is not verified
    return <Navigate to="/verify-identity" replace />;
  }

  return <>{children}</>;
};

export default VerifiedUserRoute;
