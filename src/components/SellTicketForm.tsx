import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createResaleListing } from '../services/resaleService';
import { Upload, Ticket, QrCodeIcon, AlertTriangle, Check, X } from 'lucide-react';
import { 
  validateResaleTicket
} from '../services/ticketTransferService';

interface SellTicketFormProps {
  eventId: string;
  eventTitle: string;
  onListingCreated: () => void;
  onCancel: () => void;
}

const SellTicketForm: React.FC<SellTicketFormProps> = ({ 
  eventId, 
  eventTitle, 
  onListingCreated,
  onCancel 
}) => {
  const { currentUser, userProfile, verificationStatus, isSuperuser } = useAuth();
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [section, setSection] = useState<string>('');
  const [row, setRow] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<number>(1);
  
  // Ticket validation fields
  const [ticketType, setTicketType] = useState<'physical' | 'digital'>('digital');
  const [files, setFiles] = useState<File[]>([]);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [verificationResults, setVerificationResults] = useState<any[]>([]);
  const [validationId, setValidationId] = useState<string | null>(null);
  const [ticketVerificationStatus, setTicketVerificationStatus] = useState<'pending' | 'verified' | 'failed'>('pending');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleTicketInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to sell tickets');
      return;
    }
    
    // Check if user is superuser or creator and bypass verification
    const isCreatorBypass = currentUser && currentUser.email === 'javariwhilby04@gmail.com';
    if ((isSuperuser && isSuperuser()) || isCreatorBypass) {
      // skip all verification checks in this form
    } else {
      // Check if user is verified before allowing to list tickets
      if (!verificationStatus.isVerified) {
        setError('You must complete identity verification before listing tickets for resale');
        // Add redirect to verification page after a short delay
        setTimeout(() => {
          window.location.href = '/verify-identity';
        }, 2000);
        return;
      }
    }
    
    if (price <= 0) {
      setError('Price must be greater than 0');
      return;
    }
    
    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    
    // Move to the next step (ticket validation)
    setStep(2);
  };
  
  const handleTicketValidationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to sell tickets');
      return;
    }
    
    // Check if user is superuser or creator and bypass verification
    const isCreatorBypass = currentUser && currentUser.email === 'javariwhilby04@gmail.com';
    if ((isSuperuser && isSuperuser()) || isCreatorBypass) {
      // skip all verification checks in this form
    } else {
      // Double-check verification status before proceeding
      if (!verificationStatus.isVerified) {
        setError('You must complete identity verification before listing tickets for resale');
        setTimeout(() => {
          window.location.href = '/verify-identity';
        }, 2000);
        return;
      }
    }
    
    if (ticketType === 'digital' && files.length === 0) {
      setError('Please upload at least one ticket file');
      return;
    }
    
    if (ticketType === 'physical' && !qrCodeData.trim()) {
      setError('Please enter the QR code or barcode data');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create a temporary validation ID to associate files with this listing
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      setValidationId(tempId);
      
      if (ticketType === 'digital' && files.length > 0) {
        // Process digital tickets
        setIsProcessing(true);
        
        // Upload and validate each file
        for (const file of files) {
          const result = await validateResaleTicket(file, null, tempId, 'digital');
          setVerificationResults(prev => [...prev, result]);
          
          if (result.verificationStatus === 'verified') {
            setTicketVerificationStatus('verified');
          }
        }
      } else if (ticketType === 'physical' && qrCodeData.trim()) {
        // Process physical ticket with QR code
        const result = await validateResaleTicket(null, qrCodeData.trim(), tempId, 'physical');
        
        setVerificationResults([result]);
        
        if (result.verificationStatus === 'verified') {
          setTicketVerificationStatus('verified');
        }
      }
      
      setIsProcessing(false);
      
      // If verified, move to create listing
      if (ticketVerificationStatus === 'verified') {
        await handleCreateListing();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to validate ticket');
      setIsProcessing(false);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateListing = async () => {
    setLoading(true);
    setError('');
    
    // Final verification check before creating the listing
    const isCreatorBypass = currentUser && currentUser.email === 'javariwhilby04@gmail.com';
    if (!verificationStatus.isVerified && !(isSuperuser && isSuperuser()) && !isCreatorBypass) {
      setError('You must complete identity verification before listing tickets for resale');
      setTimeout(() => {
        window.location.href = '/verify-identity';
      }, 2000);
      setLoading(false);
      return;
    }
    
    try {
      const ticketData = {
        eventId,
        sellerId: currentUser!.uid,
        sellerName: userProfile?.displayName || currentUser!.email || 'Anonymous',
        price: parseFloat(String(price)), // Ensure price is a number
        quantity,
        section: section || undefined,
        row: row || undefined,
        createdAt: new Date().toISOString(),
        eventTitle,
        validationId: validationId || undefined,
        ticketFiles: files.length > 0 ? files.map(f => f.name) : undefined,
        ticketType
      };
      
      await createResaleListing(ticketData);
      onListingCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };
  
  const renderVerificationStatus = () => {
    if (verificationResults.length === 0) {
      return null;
    }
    
    return (
      <div className="mt-6 bg-white p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Verification Results</h3>
        {verificationResults.map((result, index) => (
          <div key={index} className="border-b pb-4 mb-4">
            <div className="flex items-center mb-2">
              {result.verificationStatus === 'verified' ? (
                <div className="flex items-center text-green-600">
                  <Check className="h-5 w-5 mr-2" />
                  <span className="font-medium">Verified</span>
                </div>
              ) : result.verificationStatus === 'flagged' ? (
                <div className="flex items-center text-amber-600">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Flagged for Review</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <X className="h-5 w-5 mr-2" />
                  <span className="font-medium">Verification Failed</span>
                </div>
              )}
            </div>
            <div className="flex items-center mb-2">
              <span className="text-gray-600 mr-2">Confidence:</span>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    result.confidenceScore > 0.8 
                      ? 'bg-green-600' 
                      : result.confidenceScore > 0.6 
                        ? 'bg-amber-500' 
                        : 'bg-red-600'
                  }`} 
                  style={{ width: `${result.confidenceScore * 100}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm text-gray-600">
                {Math.round(result.confidenceScore * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render different form steps
  if (step === 1) {
    // Ticket details form (price, quantity, section, etc.)
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Sell Tickets for {eventTitle}</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {/* Show verification status if not verified */}
        {!verificationStatus.isVerified && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md mb-4 flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Verification Required</p>
              <p className="text-sm mt-1">You must complete identity verification before listing tickets for resale.</p>
              <a 
                href="/verify-identity" 
                className="inline-block mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                Complete Verification →
              </a>
            </div>
          </div>
        )}
        
        <form onSubmit={handleTicketInfoSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Price per Ticket ($)
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Section (optional)
            </label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Row (optional)
            </label>
            <input
              type="text"
              value={row}
              onChange={(e) => setRow(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                !verificationStatus.isVerified ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
              disabled={loading || !verificationStatus.isVerified}
            >
              {!verificationStatus.isVerified ? 'Verification Required' : 'Continue to Validation'}
            </button>
          </div>
        </form>
      </div>
    );
  } else if (step === 2) {
    // Ticket validation form (upload files or enter QR code)
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Validate Your Ticket</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-lg font-medium text-gray-700">Processing your ticket...</p>
            <p className="text-sm text-gray-500 mt-2">
              We're analyzing your ticket to verify its authenticity.
            </p>
          </div>
        ) : (
          <form onSubmit={handleTicketValidationSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Ticket Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTicketType('digital')}
                  className={`p-4 border rounded-lg flex flex-col items-center justify-center transition-colors ${
                    ticketType === 'digital'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 hover:border-indigo-300'
                  }`}
                >
                  <Upload className="h-6 w-6 mb-2" />
                  <span>Digital Ticket</span>
                  <span className="text-xs text-gray-500 mt-1">Upload PDF, image, or wallet pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTicketType('physical')}
                  className={`p-4 border rounded-lg flex flex-col items-center justify-center transition-colors ${
                    ticketType === 'physical'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 hover:border-indigo-300'
                  }`}
                >
                  <Ticket className="h-6 w-6 mb-2" />
                  <span>Physical Ticket</span>
                  <span className="text-xs text-gray-500 mt-1">Enter ticket barcode or QR code</span>
                </button>
              </div>
            </div>
            
            {/* File upload section for digital tickets */}
            {ticketType === 'digital' && (
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Upload Ticket Files
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-2">
                    Drag and drop your ticket files, or click to browse
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    Supported formats: PDF, PNG, JPG, PKPASS
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.pkpass"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
                  />
                </div>
                
                {/* File list */}
                {files.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Files:</p>
                    <ul className="border rounded-md divide-y">
                      {files.map((file, index) => (
                        <li key={index} className="flex items-center justify-between p-3">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex items-center justify-center bg-gray-100 rounded-md">
                              {file.type.includes('pdf') ? (
                                <span className="text-xs font-medium">PDF</span>
                              ) : file.type.includes('image') ? (
                                <span className="text-xs font-medium">IMG</span>
                              ) : (
                                <span className="text-xs font-medium">FILE</span>
                              )}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-700">{file.name}</p>
                              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {/* QR Code input for physical tickets */}
            {ticketType === 'physical' && (
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Enter Ticket Code
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6">
                  <div className="flex flex-col items-center justify-center">
                    <QrCodeIcon className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-4">
                      Enter the barcode or QR code from your ticket
                    </p>
                    <input
                      type="text"
                      value={qrCodeData}
                      onChange={(e) => setQrCodeData(e.target.value)}
                      placeholder="Enter ticket code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div className="mt-4 bg-yellow-50 p-4 rounded-md">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-700 font-medium">Important</p>
                      <p className="text-sm text-yellow-600 mt-1">
                        Enter the ticket code exactly as it appears on your physical ticket.
                        This validates the authenticity of your ticket.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {renderVerificationStatus()}
            
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  !verificationStatus.isVerified || loading || (ticketType === 'digital' && files.length === 0) || (ticketType === 'physical' && !qrCodeData.trim())
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
                disabled={loading || !verificationStatus.isVerified || (ticketType === 'digital' && files.length === 0) || (ticketType === 'physical' && !qrCodeData.trim())}
              >
                {loading ? 'Processing...' : !verificationStatus.isVerified ? 'Verification Required' : 'Validate & List Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }
  
  return null;
};

export default SellTicketForm;
