import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPendingVerifications, updateVerificationStatus } from '../services/verificationService';
import { VerificationData } from '../models/verification';
import { Check, X, Eye, Clock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VerificationRequests: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [requests, setRequests] = useState<VerificationData[]>([]);
  const [activeRequest, setActiveRequest] = useState<VerificationData | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin()) {
      navigate('/profile');
      return;
    }
    
    loadVerificationRequests();
  }, [isAdmin, navigate]);
  
  const loadVerificationRequests = async () => {
    setLoading(true);
    setError('');
    
    try {
      const pendingVerifications = await getPendingVerifications();
      setRequests(pendingVerifications);
    } catch (err) {
      console.error('Error loading verification requests:', err);
      setError('Failed to load verification requests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleApprove = async (userId: string) => {
    try {
      await updateVerificationStatus(userId, 'approved', reviewNotes);
      setSuccessMessage(`User ${userId} verification approved successfully.`);
      
      // Remove the approved request from the list
      setRequests(prev => prev.filter(req => req.userId !== userId));
      setActiveRequest(null);
      setReviewNotes('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error approving verification:', err);
      setError('Failed to approve verification. Please try again.');
    }
  };
  
  const handleReject = async (userId: string) => {
    if (!reviewNotes) {
      setError('Please provide rejection notes explaining the reason.');
      return;
    }
    
    try {
      await updateVerificationStatus(userId, 'rejected', reviewNotes);
      setSuccessMessage(`User ${userId} verification rejected.`);
      
      // Remove the rejected request from the list
      setRequests(prev => prev.filter(req => req.userId !== userId));
      setActiveRequest(null);
      setReviewNotes('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error rejecting verification:', err);
      setError('Failed to reject verification. Please try again.');
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Verification Requests</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Requests List */}
        <div className="w-full md:w-1/3">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-4 bg-indigo-600 text-white">
              <h2 className="font-medium">Pending Requests ({requests.length})</h2>
            </div>
            
            {loading ? (
              <div className="p-6 text-center">
                <div className="spinner w-8 h-8 border-4 border-t-indigo-600 border-r-transparent border-b-indigo-600 border-l-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-gray-500">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No pending verification requests.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {requests.map(request => (
                  <li 
                    key={request.userId}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${activeRequest?.userId === request.userId ? 'bg-indigo-50' : ''}`}
                    onClick={() => setActiveRequest(request)}
                  >
                    <div className="flex items-center">
                      <div className="bg-indigo-100 rounded-full p-2 mr-3">
                        <User className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium">{request.fullName}</p>
                        <p className="text-sm text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" /> 
                          Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Request Details */}
        <div className="w-full md:w-2/3">
          {activeRequest ? (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h2 className="font-semibold text-lg">{activeRequest.fullName}'s Verification Request</h2>
                <p className="text-sm text-gray-500">
                  Submitted: {new Date(activeRequest.submittedAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Identification Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Identification</h3>
                    
                    <div>
                      <p className="text-sm text-gray-500">ID Type</p>
                      <p className="font-medium">{activeRequest.idType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">ID Number</p>
                      <p className="font-medium">{activeRequest.idNumber}</p>
                    </div>
                    
                    {activeRequest.idDocumentUrl && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">ID Document</p>
                        <a 
                          href={activeRequest.idDocumentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded inline-flex items-center hover:bg-indigo-100"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Document
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {/* Banking Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Banking Information</h3>
                    
                    <div>
                      <p className="text-sm text-gray-500">Account Holder</p>
                      <p className="font-medium">{activeRequest.accountHolderName}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Bank Name</p>
                      <p className="font-medium">{activeRequest.bankName}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Account Type</p>
                      <p className="font-medium">{activeRequest.accountType.replace(/^\w/, c => c.toUpperCase())}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Account Number</p>
                      <p className="font-medium">**** **** **** {activeRequest.accountNumber.slice(-4)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Routing Number</p>
                      <p className="font-medium">**** **** {activeRequest.routingNumber.slice(-4)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Address Information if provided */}
                {activeRequest.address && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-4">Address Information</h3>
                    
                    <p>
                      {activeRequest.address.street}<br />
                      {activeRequest.address.city}, {activeRequest.address.state} {activeRequest.address.postalCode}<br />
                      {activeRequest.address.country}
                    </p>
                  </div>
                )}
                
                {/* Review Notes */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="reviewNotes">
                    Review Notes
                  </label>
                  <textarea
                    id="reviewNotes"
                    name="reviewNotes"
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about your review decision..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => handleReject(activeRequest.userId)}
                    className="bg-red-100 text-red-600 px-4 py-2 rounded hover:bg-red-200 flex items-center"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleApprove(activeRequest.userId)}
                    className="bg-green-100 text-green-600 px-4 py-2 rounded hover:bg-green-200 flex items-center"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Eye className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a verification request</h3>
              <p className="text-gray-500">
                Click on a request from the list to view and process it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationRequests;
