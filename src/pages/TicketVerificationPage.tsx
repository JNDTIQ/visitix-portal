import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getTicketTransfer, 
  getTicketVerifications,
  updateTicketTransfer,
  processTicketCode,
  checkTicketFraudRisk
} from '../services/ticketTransferService';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  QrCode,
  BarChart,
  Camera,
  Lock,
  Shield,
  Eye,
  Flag
} from 'lucide-react';

const TicketVerificationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [transfer, setTransfer] = useState<any>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketCode, setTicketCode] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationNote, setVerificationNote] = useState<string>('');
  const [fraudRisk, setFraudRisk] = useState<any>(null);
  const [showImagePreview, setShowImagePreview] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Load ticket transfer
        const transferData = await getTicketTransfer(id);
        if (!transferData) {
          setError("Ticket transfer not found");
          return;
        }
        
        setTransfer(transferData);
        
        // Load verifications
        const verificationData = await getTicketVerifications(id);
        setVerifications(verificationData);
        
        // Check fraud risk
        const riskAssessment = await checkTicketFraudRisk(transferData);
        setFraudRisk(riskAssessment);
        
      } catch (err) {
        console.error("Error loading ticket data:", err);
        setError("Failed to load ticket data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !ticketCode.trim()) {
      return;
    }
    
    try {
      setIsVerifying(true);
      
      // Determine if it's a QR code or barcode based on length
      const codeType = ticketCode.length > 20 ? 'qrcode' : 'barcode';
      
      // Process the code
      const results = await processTicketCode(id, ticketCode, codeType);
      
      // Refresh verifications
      const verificationData = await getTicketVerifications(id);
      setVerifications(verificationData);
      
      // Clear input
      setTicketCode('');
      
    } catch (err) {
      console.error("Error verifying code:", err);
      setError("Failed to verify ticket code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleApproveTransfer = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Update the transfer status
      await updateTicketTransfer(id, {
        status: 'verified',
        metadata: {
          ...transfer.metadata,
          adminVerified: true,
          adminNotes: verificationNote,
          verifiedAt: new Date(),
          verifiedBy: currentUser?.uid
        }
      });
      
      // Refresh data
      const transferData = await getTicketTransfer(id);
      setTransfer(transferData);
      
      // Show success
      alert("Ticket has been approved for transfer");
      
    } catch (err) {
      console.error("Error approving transfer:", err);
      setError("Failed to approve transfer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFlagTransfer = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Update the transfer status
      await updateTicketTransfer(id, {
        status: 'flagged',
        metadata: {
          ...transfer.metadata,
          flaggedAt: new Date(),
          flaggedBy: currentUser?.uid,
          flagReason: verificationNote
        }
      });
      
      // Refresh data
      const transferData = await getTicketTransfer(id);
      setTransfer(transferData);
      
      // Show success
      alert("Ticket has been flagged for further review");
      
    } catch (err) {
      console.error("Error flagging transfer:", err);
      setError("Failed to flag transfer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImagePreview = (url: string) => {
    setSelectedImage(url);
    setShowImagePreview(true);
  };

  if (loading && !transfer) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-lg text-gray-700">Loading ticket information...</p>
        </div>
      </div>
    );
  }

  if (error && !transfer) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 p-6 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
            <h2 className="text-xl font-bold text-red-700">Error</h2>
          </div>
          <p className="mt-2 text-red-600">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">Ticket Verification</h2>
          <div className="flex">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Back
            </button>
          </div>
        </div>
        <p className="mt-2 text-gray-600">
          Verify this ticket transfer to ensure it's legitimate before it can be sold or transferred.
        </p>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-md">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {transfer && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ticket Information */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">Ticket Information</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  transfer.status === 'verified' 
                    ? 'bg-green-100 text-green-800' 
                    : transfer.status === 'flagged' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Ticket Type</p>
                  <p className="font-medium">{transfer.ticketType.charAt(0).toUpperCase() + transfer.ticketType.slice(1)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Event ID</p>
                  <p className="font-medium">{transfer.eventId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Seller ID</p>
                  <p className="font-medium">{transfer.sellerId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">
                    {transfer.createdAt instanceof Date
                      ? transfer.createdAt.toLocaleString()
                      : new Date(transfer.createdAt?.seconds * 1000).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {/* Ticket Files */}
              {transfer.ticketFiles && transfer.ticketFiles.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-3">Ticket Files</h4>
                  <div className="border rounded-md divide-y">
                    {transfer.ticketFiles.map((file: any, index: number) => (
                      <div key={index} className="p-4 flex justify-between items-center">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="font-medium">{file.fileName}</p>
                            <p className="text-sm text-gray-500">
                              {file.fileType} • {(file.fileSize / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`mr-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            file.processedStatus === 'processed'
                              ? 'bg-green-100 text-green-800'
                              : file.processedStatus === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {file.processedStatus.charAt(0).toUpperCase() + file.processedStatus.slice(1)}
                          </span>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => window.open(file.fileUrl, '_blank')}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </button>
                            
                            {file.fileType.includes('image') && (
                              <button
                                onClick={() => handleImagePreview(file.fileUrl)}
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                Preview
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* OCR Data */}
              {transfer.ticketFiles && transfer.ticketFiles.some((file: any) => file.extractedData) && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-3">Extracted Ticket Data</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    {transfer.ticketFiles
                      .filter((file: any) => file.extractedData)
                      .map((file: any, index: number) => (
                        <div key={index} className="mb-4 last:mb-0">
                          <p className="text-sm font-medium mb-2">From: {file.fileName}</p>
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(file.extractedData).map(([key, value]: [string, any]) => (
                              <div key={key}>
                                <p className="text-xs text-gray-500">{key}</p>
                                <p className="font-medium">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Verification Results */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Verification Results</h3>
              
              {verifications.length === 0 ? (
                <p className="text-gray-500">No verifications have been performed yet.</p>
              ) : (
                <div className="space-y-4">
                  {verifications.map((verification, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center">
                          {verification.verificationMethod === 'ocr' ? (
                            <Eye className="h-5 w-5 text-indigo-600 mr-2" />
                          ) : verification.verificationMethod === 'qrcode' ? (
                            <QrCode className="h-5 w-5 text-indigo-600 mr-2" />
                          ) : (
                            <BarChart className="h-5 w-5 text-indigo-600 mr-2" />
                          )}
                          <span className="font-medium">
                            {verification.verificationMethod.toUpperCase()} Verification
                          </span>
                        </div>
                        <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          verification.verificationStatus === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : verification.verificationStatus === 'flagged'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {verification.verificationStatus.charAt(0).toUpperCase() + verification.verificationStatus.slice(1)}
                        </div>
                      </div>
                      
                      <div className="flex items-center mb-3">
                        <span className="text-gray-600 text-sm mr-2">Confidence:</span>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              verification.confidenceScore > 0.8 
                                ? 'bg-green-600' 
                                : verification.confidenceScore > 0.6 
                                ? 'bg-yellow-500' 
                                : 'bg-red-600'
                            }`} 
                            style={{ width: `${verification.confidenceScore * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {Math.round(verification.confidenceScore * 100)}%
                        </span>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-xs text-gray-500 mb-2">Verification Data:</p>
                        <pre className="text-xs overflow-auto max-h-32">
                          {JSON.stringify(verification.verificationData, null, 2)}
                        </pre>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        Verified at: {verification.verifiedAt instanceof Date
                          ? verification.verifiedAt.toLocaleString()
                          : new Date(verification.verifiedAt?.seconds * 1000).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Verification Actions */}
          <div className="md:col-span-1">
            {/* Fraud Risk Assessment */}
            {fraudRisk && (
              <div className={`mb-6 p-4 rounded-lg ${
                fraudRisk.riskLevel === 'high'
                  ? 'bg-red-50 border border-red-200'
                  : fraudRisk.riskLevel === 'medium'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center mb-3">
                  <Shield className={`h-5 w-5 mr-2 ${
                    fraudRisk.riskLevel === 'high'
                      ? 'text-red-600'
                      : fraudRisk.riskLevel === 'medium'
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`} />
                  <h4 className="font-bold">
                    {fraudRisk.riskLevel === 'high'
                      ? 'High Fraud Risk'
                      : fraudRisk.riskLevel === 'medium'
                      ? 'Medium Fraud Risk'
                      : 'Low Fraud Risk'}
                  </h4>
                </div>
                
                <ul className="space-y-2 text-sm">
                  {fraudRisk.reasons.map((reason: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block h-4 w-4 mt-0.5 mr-2">
                        {fraudRisk.riskLevel === 'low' && reason === 'No risk factors identified' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className={`h-4 w-4 ${
                            fraudRisk.riskLevel === 'high'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                          }`} />
                        )}
                      </span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Manual Verification */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Manual Verification</h3>
              
              {/* QR/Barcode verification */}
              <form onSubmit={handleVerifyCode} className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Scan Ticket Code
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={ticketCode}
                    onChange={(e) => setTicketCode(e.target.value)}
                    placeholder="Enter QR/barcode data"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isVerifying || !ticketCode.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                <div className="mt-2 flex justify-center">
                  <button
                    type="button"
                    className="text-sm text-indigo-600 flex items-center hover:text-indigo-800"
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    <span>Scan with camera</span>
                  </button>
                </div>
              </form>
              
              {/* Admin verification note */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Verification Notes
                </label>
                <textarea
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add notes about this verification..."
                ></textarea>
              </div>
              
              {/* Admin actions */}
              <div className="space-y-3">
                <button
                  onClick={handleApproveTransfer}
                  disabled={loading || transfer.status === 'verified'}
                  className="w-full flex justify-center items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>Approve Transfer</span>
                </button>
                
                <button
                  onClick={handleFlagTransfer}
                  disabled={loading || transfer.status === 'flagged'}
                  className="w-full flex justify-center items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <Flag className="h-5 w-5 mr-2" />
                  <span>Flag for Review</span>
                </button>
              </div>
            </div>
            
            {/* Security Information */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Lock className="h-5 w-5 text-indigo-600 mr-2" />
                <h4 className="font-bold text-indigo-700">Security Information</h4>
              </div>
              <ul className="space-y-2 text-sm text-indigo-800">
                <li className="flex items-start">
                  <span className="inline-block h-4 w-4 mt-0.5 mr-2">•</span>
                  <span>Check for authentic ticket features like holograms, quality printing, or valid barcodes.</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block h-4 w-4 mt-0.5 mr-2">•</span>
                  <span>Verify ticket details against event database.</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block h-4 w-4 mt-0.5 mr-2">•</span>
                  <span>Flag tickets with suspicious patterns or seller behavior.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Image Preview Modal */}
      {showImagePreview && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Ticket Image Preview</h3>
              <button
                onClick={() => setShowImagePreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[calc(90vh-8rem)]">
              <img
                src={selectedImage}
                alt="Ticket Preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setShowImagePreview(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketVerificationPage;
