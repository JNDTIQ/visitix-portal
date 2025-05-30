import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { submitVerification } from '../services/verificationService';
import { VerificationSubmission } from '../models/verification';
import { AlertCircle, Check, Upload } from 'lucide-react';

const VerificationForm: React.FC = () => {
  const { currentUser, refreshVerificationStatus } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState<VerificationSubmission>({
    fullName: '',
    idType: 'driverLicense',
    idNumber: '',
    
    accountHolderName: '',
    accountType: 'checking',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'USA'
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields like address.street
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as object,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to submit verification documents');
      return;
    }
    
    // Validate form
    if (!formData.fullName || !formData.idNumber) {
      setError('Please fill in all required identification fields');
      return;
    }
    
    if (!formData.accountHolderName || !formData.bankName || !formData.accountNumber || !formData.routingNumber) {
      setError('Please fill in all required banking fields');
      return;
    }
    
    if (!selectedFile) {
      setError('Please upload a photo of your ID');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Submit verification with file
      const submissionData: VerificationSubmission = {
        ...formData,
        idDocument: selectedFile
      };
      
      const result = await submitVerification(currentUser.uid, submissionData);
      
      if (result.success) {
        setSuccess('Your verification information has been submitted successfully. We will review your information shortly.');
        
        // Refresh verification status
        await refreshVerificationStatus();
        
        // Redirect to profile after a short delay
        setTimeout(() => {
          navigate('/profile');
        }, 3000);
      } else {
        setError(result.error || 'Failed to submit verification information');
      }
    } catch (err) {
      console.error('Error submitting verification:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Verify Your Identity & Banking Information</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              To ensure the security of our platform and comply with regulations, we require verification 
              before you can list tickets for sale. Your information is encrypted and securely stored.
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">Identification</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="fullName">
                Full Name (as it appears on ID) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="idType">
                ID Type <span className="text-red-500">*</span>
              </label>
              <select
                id="idType"
                name="idType"
                value={formData.idType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="driverLicense">Driver's License</option>
                <option value="passport">Passport</option>
                <option value="nationalId">National ID</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="idNumber">
                ID Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="idNumber"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Upload ID Document <span className="text-red-500">*</span>
              </label>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf"
              />
              
              <div 
                className="border-2 border-dashed border-gray-300 rounded-md p-6 cursor-pointer hover:bg-gray-50"
                onClick={triggerFileInput}
              >
                <div className="flex flex-col items-center justify-center">
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  {selectedFile ? (
                    <div className="text-center">
                      <span className="text-indigo-600 font-medium">{selectedFile.name}</span>
                      <p className="text-gray-500 text-sm mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="text-gray-600">Click to upload your ID document</span>
                      <p className="text-gray-500 text-sm mt-1">
                        Supported formats: JPEG, PNG, PDF (max 10MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">Banking Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="accountHolderName">
                Account Holder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="accountHolderName"
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="bankName">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="accountType">
                Account Type <span className="text-red-500">*</span>
              </label>
              <select
                id="accountType"
                name="accountType"
                value={formData.accountType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="routingNumber">
                Routing Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="routingNumber"
                name="routingNumber"
                value={formData.routingNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
                pattern="^\d{9}$"
                title="Routing number must be 9 digits"
              />
              <p className="text-xs text-gray-500 mt-1">9-digit number</p>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="accountNumber">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-200">Address</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="address.street">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address.street"
                name="address.street"
                value={formData.address?.street}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="address.city">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={formData.address?.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="address.state">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address.state"
                name="address.state"
                value={formData.address?.state}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="address.postalCode">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address.postalCode"
                name="address.postalCode"
                value={formData.address?.postalCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="address.country">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address.country"
                name="address.country"
                value={formData.address?.country}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-4">
            By submitting this form, you agree to our Terms of Service and Privacy Policy. 
            We will securely store your information and use it only for verification purposes.
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:bg-indigo-300 font-medium"
          >
            {loading ? 'Submitting...' : 'Submit Verification'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VerificationForm;
