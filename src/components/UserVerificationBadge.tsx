import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserVerificationBadgeProps {
  showLink?: boolean;
  className?: string;
}

const UserVerificationBadge: React.FC<UserVerificationBadgeProps> = ({ showLink = true, className = '' }) => {
  const { verificationStatus } = useAuth();
  
  if (!verificationStatus) {
    return null;
  }
  
  const { isVerified, status } = verificationStatus;
  
  // Status is not available
  if (!status) {
    return (
      <div className={`inline-flex items-center rounded-full bg-gray-100 text-gray-800 px-3 py-1 ${className}`}>
        <AlertCircle className="h-4 w-4 mr-1.5" />
        <span className="text-sm">
          Verification Required
          {showLink && (
            <Link to="/verify-identity" className="ml-2 text-indigo-600 hover:text-indigo-800 font-medium">
              Verify Now
            </Link>
          )}
        </span>
      </div>
    );
  }
  
  // Status is pending
  if (status === 'pending') {
    return (
      <div className={`inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 ${className}`}>
        <Clock className="h-4 w-4 mr-1.5" />
        <span className="text-sm">Verification Pending</span>
      </div>
    );
  }
  
  // Status is approved
  if (status === 'approved') {
    return (
      <div className={`inline-flex items-center rounded-full bg-green-100 text-green-800 px-3 py-1 ${className}`}>
        <CheckCircle className="h-4 w-4 mr-1.5" />
        <span className="text-sm">Verified</span>
      </div>
    );
  }
  
  // Status is rejected
  if (status === 'rejected') {
    return (
      <div className={`inline-flex items-center rounded-full bg-red-100 text-red-800 px-3 py-1 ${className}`}>
        <XCircle className="h-4 w-4 mr-1.5" />
        <span className="text-sm">
          Verification Rejected
          {showLink && (
            <Link to="/verify-identity" className="ml-2 text-indigo-600 hover:text-indigo-800 font-medium">
              Try Again
            </Link>
          )}
        </span>
      </div>
    );
  }
  
  // Fallback
  return null;
};

export default UserVerificationBadge;
