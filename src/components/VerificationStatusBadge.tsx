import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

export type VerificationStatus = 'verified' | 'pending' | 'flagged' | 'failed';

interface VerificationStatusBadgeProps {
  status: VerificationStatus;
  confidenceScore?: number;
  className?: string;
  showConfidence?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const VerificationStatusBadge: React.FC<VerificationStatusBadgeProps> = ({
  status,
  confidenceScore,
  className = '',
  showConfidence = false,
  size = 'md'
}) => {
  // Determine colors and icon based on status
  const getStatusConfig = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          icon: <CheckCircle className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} mr-1`} />,
          label: 'Verified'
        };
      case 'pending':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          icon: <Clock className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} mr-1`} />,
          label: 'Pending'
        };
      case 'flagged':
        return {
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          icon: <AlertTriangle className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} mr-1`} />,
          label: 'Flagged'
        };
      case 'failed':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          icon: <XCircle className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} mr-1`} />,
          label: 'Failed'
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          icon: <Clock className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} mr-1`} />,
          label: 'Unknown'
        };
    }
  };

  const config = getStatusConfig(status);
  
  // Size classes
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  return (
    <div className={`inline-flex items-center rounded-full ${config.bgColor} ${config.textColor} ${sizeClasses[size]} font-medium ${className}`}>
      {config.icon}
      <span>{config.label}</span>
      
      {showConfidence && confidenceScore !== undefined && (
        <span className="ml-1 text-xs opacity-75">
          ({Math.round(confidenceScore * 100)}%)
        </span>
      )}
    </div>
  );
};

export default VerificationStatusBadge;
