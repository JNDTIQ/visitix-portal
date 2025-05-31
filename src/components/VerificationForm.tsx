import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { submitVerification } from '../services/verificationService';
import { VerificationSubmission } from '../models/verification';
import { AlertCircle, Check, Upload } from 'lucide-react';
import DirectUpload from './DirectUpload';

const VerificationForm: React.FC = () => {
  const { currentUser, refreshVerificationStatus } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [useDirectUpload, setUseDirectUpload] = useState(false);
  const [directUploadUrl, setDirectUploadUrl] = useState('');

  // Form state
  const [formData, setFormData] = useState<VerificationSubmission>({
    fullName: '',
    idType: 'driverLicense',
    idNumber: '',
    
    accountHolderName: '',
    accountType: 'checking',
    bankName: '',
    accountNumber: '',
    branchNumber: '', // New field for Caribbean banks
    
    address: {
      street: '',
      streetDetails: '', // New field for additional street details
      parish: '', // New field for Jamaican parish
      city: '',
      country: 'Jamaica',
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
    
    if (!formData.accountHolderName || !formData.bankName || !formData.accountNumber || !formData.branchNumber) {
      setError('Please fill in all required banking fields');
      return;
    }
    
    if (!selectedFile && !directUploadUrl) {
      setError('Please upload a photo of your ID');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Submit verification with file
      const submissionData: VerificationSubmission = {
        ...formData,
        idDocument: selectedFile || undefined
      };
      
      // If we have a direct upload URL, we'll use that instead
      if (directUploadUrl) {
        submissionData.idDocumentDirectUrl = directUploadUrl;
      }
      
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
        if (result.error && (result.error.includes('CORS') || result.error.includes('upload'))) {
          setError(
            `${result.error || 'Failed to submit verification information'}. 
            Please try using our troubleshooting page to resolve the issue: 
            <a href="/troubleshoot" class="text-indigo-600 hover:text-indigo-800 underline">Go to Troubleshooting</a>`
          );
        } else {
          setError(result.error || 'Failed to submit verification information');
        }
      }
    } catch (err) {
      console.error('Error submitting verification:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      
      if (errorMessage.includes('CORS') || errorMessage.includes('upload')) {
        setError(
          `${errorMessage}. 
          Please try using our troubleshooting page to resolve the issue: 
          <a href="/troubleshoot" class="text-indigo-600 hover:text-indigo-800 underline">Go to Troubleshooting</a>`
        );
      } else {
        setError(errorMessage);
      }
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
              <p className="text-sm text-red-700" dangerouslySetInnerHTML={{ __html: error }}></p>
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
              
              {useDirectUpload ? (
                <div className="mb-4">
                  <DirectUpload 
                    userId={currentUser?.uid || ''} 
                    onUploadSuccess={(url) => {
                      setDirectUploadUrl(url);
                      setError('');
                    }}
                    onUploadError={(err) => setError(err)}
                  />
                  {directUploadUrl && (
                    <div className="mt-2 bg-green-50 p-3 rounded-md flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm text-green-700">Document uploaded successfully</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setUseDirectUpload(false)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 mt-2"
                  >
                    Switch to regular upload
                  </button>
                </div>
              ) : (
                <>
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
                  <button
                    type="button"
                    onClick={() => setUseDirectUpload(true)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 mt-2"
                  >
                    Having trouble uploading? Try direct upload
                  </button>
                </>
              )}
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
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="branchNumber">
                Branch Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="branchNumber"
                name="branchNumber"
                value={formData.branchNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Enter your bank branch number</p>
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
            <div className="col-span-2">
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="address.streetDetails">
                Additional Street Details
              </label>
              <input
                type="text"
                id="address.streetDetails"
                name="address.streetDetails"
                value={formData.address?.streetDetails}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="address.parish">
                Parish <span className="text-red-500">*</span>
              </label>
              <select
                id="address.parish"
                name="address.parish"
                value={formData.address?.parish}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select Parish</option>
                <option value="Kingston">Kingston</option>
                <option value="St. Andrew">St. Andrew</option>
                <option value="St. Thomas">St. Thomas</option>
                <option value="Portland">Portland</option>
                <option value="St. Mary">St. Mary</option>
                <option value="St. Ann">St. Ann</option>
                <option value="Trelawny">Trelawny</option>
                <option value="St. James">St. James</option>
                <option value="Hanover">Hanover</option>
                <option value="Westmoreland">Westmoreland</option>
                <option value="St. Elizabeth">St. Elizabeth</option>
                <option value="Manchester">Manchester</option>
                <option value="Clarendon">Clarendon</option>
                <option value="St. Catherine">St. Catherine</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="address.city">
                City or Town <span className="text-red-500">*</span>
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
