import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  uploadTicketFile, 
  createTicketTransfer, 
  processTicketWithOCR,
  processTicketCode,
  TicketTransfer
} from '../services/ticketTransferService';
import { fetchTickets } from '../services/ticketService';
import { useAuth } from '../contexts/AuthContext';
import { QrCodeIcon, Ticket, Upload, BarChart4, AlertTriangle, Check, X } from 'lucide-react';

const TicketTransferPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  
  const [ticketType, setTicketType] = useState<'physical' | 'digital'>('digital');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [transferId, setTransferId] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [verificationResults, setVerificationResults] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    // Load user's tickets for this event if eventId is provided
    const loadTickets = async () => {
      try {
        if (eventId) {
          const userTickets = await fetchTickets();
          const filteredTickets = userTickets.filter(
            (ticket: any) => ticket.eventId === eventId && ticket.ownerId === currentUser?.uid
          );
          setTickets(filteredTickets);
        }
      } catch (err) {
        console.error("Error loading tickets:", err);
        setError("Failed to load your tickets. Please try again.");
      }
    };

    if (currentUser) {
      loadTickets();
    }
  }, [currentUser, eventId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("You must be logged in to transfer tickets");
      return;
    }

    if (ticketType === 'digital' && files.length === 0) {
      setError("Please upload at least one ticket file");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Create a ticket transfer record
      const transferData: Omit<TicketTransfer, 'createdAt' | 'updatedAt' | 'id'> = {
        sellerId: currentUser.uid,
        buyerId: null, // Will be assigned when someone purchases the ticket
        eventId: eventId || '',
        ticketType,
        status: 'pending',
        price: 0, // This would be set based on user input in a real app
        originalTicketId: selectedTicket || undefined,
        ticketFiles: [],
        verificationResults: []
      };
      
      // Create the transfer record
      const newTransferId = await createTicketTransfer(transferData);
      setTransferId(newTransferId);
      
      // For digital tickets, upload files
      if (ticketType === 'digital' && files.length > 0) {
        const uploadPromises = files.map(file => uploadTicketFile(file, newTransferId));
        const uploadedFiles = await Promise.all(uploadPromises);
        
        // Process each uploaded file
        setIsProcessing(true);
        
        for (const file of uploadedFiles) {
          // Process with OCR
          await processTicketWithOCR(newTransferId, file.id || '');
        }
        
        setIsProcessing(false);
      }
      
      // Move to next step
      setStep(2);
      setSuccess(true);
    } catch (err) {
      console.error("Error in ticket transfer:", err);
      setError("Failed to process ticket transfer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQRCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transferId) {
      setError("No active ticket transfer found");
      return;
    }
    
    if (!qrCodeData.trim()) {
      setError("Please enter the QR code or barcode data");
      return;
    }
    
    try {
      setLoading(true);
      
      // Process the QR code data
      const results = await processTicketCode(
        transferId,
        qrCodeData.trim(),
        qrCodeData.length > 20 ? 'qrcode' : 'barcode' // Simple heuristic, would be more sophisticated in real app
      );
      
      setVerificationResults(prev => [...prev, results]);
      
      // If verification was successful, move to next step
      if (results.verificationStatus === 'verified') {
        setStep(3);
      }
      
      setQrCodeData('');
    } catch (err) {
      console.error("Error processing QR code:", err);
      setError("Failed to process ticket code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderVerificationStatus = () => {
    if (verificationResults.length === 0) {
      return null;
    }
    
    return (
      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
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
            {result.verificationStatus === 'flagged' && (
              <div className="bg-amber-50 p-3 rounded text-amber-800 text-sm mt-2">
                <p><strong>Note:</strong> This ticket has been flagged for additional verification. 
                Our team will review it within 24 hours.</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleSubmit}>
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
                  <span className="text-xs text-gray-500 mt-1">Enter ticket details manually</span>
                </button>
              </div>
            </div>

            {/* Ticket selection if available */}
            {tickets.length > 0 && (
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Select Your Ticket (Optional)
                </label>
                <select
                  value={selectedTicket || ''}
                  onChange={(e) => setSelectedTicket(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Select a ticket --</option>
                  {tickets.map((ticket) => (
                    <option key={ticket.id} value={ticket.id}>
                      {ticket.eventName} - {ticket.seatInfo || 'General Admission'}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Linking to an existing ticket helps with verification
                </p>
              </div>
            )}

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

            {/* Additional info section for physical tickets */}
            {ticketType === 'physical' && (
              <div className="mb-6 bg-yellow-50 p-4 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-700 font-medium">Physical Ticket Information</p>
                    <p className="text-sm text-yellow-600 mt-1">
                      In the next step, you'll need to enter your ticket's barcode or QR code for verification.
                      This helps ensure the ticket is valid.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || (ticketType === 'digital' && files.length === 0)}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
            </div>
          </form>
        );
      
      case 2:
        return (
          <div>
            {isProcessing ? (
              <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
                  <p className="text-lg font-medium text-gray-700">Processing your ticket...</p>
                  <p className="text-sm text-gray-500 mt-2">
                    We're analyzing your ticket files to extract important information.
                    This helps us verify the ticket's authenticity.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleQRCodeSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Ticket Verification</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Please enter the barcode or QR code from your ticket for verification.
                    This helps ensure your ticket is authentic and can be properly transferred.
                  </p>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6">
                    <div className="flex flex-col items-center justify-center">
                      <QrCodeIcon className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-4">
                        Enter the code from your ticket
                      </p>
                      <input
                        type="text"
                        value={qrCodeData}
                        onChange={(e) => setQrCodeData(e.target.value)}
                        placeholder="Enter ticket code"
                        className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !qrCodeData.trim()}
                    className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Verify Ticket'}
                  </button>
                </div>
              </form>
            )}
            
            {renderVerificationStatus()}
          </div>
        );
      
      case 3:
        return (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Transfer Ready</h2>
              <p className="text-gray-600 mb-6">
                Your ticket has been verified and is ready to be listed for transfer.
                You'll be notified when someone purchases your ticket.
              </p>
              
              <button
                onClick={() => navigate('/profile')}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to My Tickets
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Transfer Your Ticket</h2>
        <p className="mt-2 text-gray-600">
          Securely transfer your ticket to someone else. We'll verify your ticket to ensure it's legitimate.
        </p>
      </div>
      
      {/* Progress steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className="ml-2">
              <p className={`text-sm font-medium ${step >= 1 ? 'text-indigo-600' : 'text-gray-500'}`}>
                Upload
              </p>
            </div>
          </div>
          <div className={`flex-1 mx-4 h-1 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
          <div className="flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className="ml-2">
              <p className={`text-sm font-medium ${step >= 2 ? 'text-indigo-600' : 'text-gray-500'}`}>
                Verify
              </p>
            </div>
          </div>
          <div className={`flex-1 mx-4 h-1 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
          <div className="flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
            <div className="ml-2">
              <p className={`text-sm font-medium ${step >= 3 ? 'text-indigo-600' : 'text-gray-500'}`}>
                Complete
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-md">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {/* Main content */}
      {renderStep()}
    </div>
  );
};

export default TicketTransferPage;
