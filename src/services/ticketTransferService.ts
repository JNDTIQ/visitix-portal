import { db, storage } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDoc,
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";

// Collection references
const ticketTransfersRef = collection(db, "ticketTransfers");
const ticketVerificationsRef = collection(db, "ticketVerifications");

// Storage path prefixes
const TICKET_FILES_PATH = "ticket-files";
const ENCRYPTED_TICKETS_PATH = "encrypted-tickets";

// Interfaces
export interface TicketFile {
  id?: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  processedStatus: 'pending' | 'processed' | 'failed';
  extractedData?: any;
}

export interface TicketTransfer {
  id?: string;
  sellerId: string;
  buyerId: string | null;
  eventId: string;
  ticketType: 'physical' | 'digital';
  status: 'pending' | 'verified' | 'transferred' | 'cancelled' | 'flagged';
  createdAt: Date;
  updatedAt: Date;
  price: number;
  originalTicketId?: string;
  ticketFiles?: TicketFile[];
  verificationResults?: TicketVerification[];
  metadata?: any;
}

export interface TicketVerification {
  id?: string;
  ticketTransferId: string;
  verificationMethod: 'ocr' | 'qrcode' | 'barcode' | 'manual';
  verificationStatus: 'pending' | 'verified' | 'failed' | 'flagged';
  verificationData: any;
  verifiedAt: Date;
  verifierNotes?: string;
  confidenceScore?: number;
}

// Generate a secure hash for a file using Web Crypto API
const generateFileHash = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Use the Web Crypto API for hashing
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        
        // Convert to hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        resolve(hashHex);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
};

// Encrypt file data (would normally use a proper encryption library)
// In a production environment, you'd implement actual encryption
const encryptFileData = async (fileData: ArrayBuffer): Promise<ArrayBuffer> => {
  // This is a placeholder - in a real app, you'd use a proper encryption library
  // Example: use the Web Crypto API to encrypt the data
  // For now, we're just returning the original data
  return fileData;
};

// Upload a ticket file securely
export const uploadTicketFile = async (
  file: File, 
  ticketTransferId: string
): Promise<TicketFile> => {
  try {
    // Generate a secure file name based on hash and timestamp
    const fileHash = await generateFileHash(file);
    const timestamp = Date.now();
    const secureFileName = `${fileHash}-${timestamp}${getFileExtension(file.name)}`;
    
    // Create a reference to the file location
    const fileRef = ref(storage, `${TICKET_FILES_PATH}/${ticketTransferId}/${secureFileName}`);
    
    // Upload the file
    await uploadBytes(fileRef, file);
    
    // Get the download URL
    const fileUrl = await getDownloadURL(fileRef);
    
    // Create a new ticket file record
    const ticketFile: TicketFile = {
      fileUrl,
      fileName: secureFileName,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date(),
      processedStatus: 'pending'
    };
    
    // Return the ticket file data
    return ticketFile;
  } catch (error) {
    console.error("Error uploading ticket file:", error);
    throw error;
  }
};

// Helper to get file extension
const getFileExtension = (filename: string): string => {
  return filename.slice(filename.lastIndexOf('.'));
};

// Create a new ticket transfer
export const createTicketTransfer = async (transferData: Omit<TicketTransfer, 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const transferDoc = await addDoc(ticketTransfersRef, {
      ...transferData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return transferDoc.id;
  } catch (error) {
    console.error("Error creating ticket transfer:", error);
    throw error;
  }
};

// Update an existing ticket transfer
export const updateTicketTransfer = async (id: string, updatedData: Partial<TicketTransfer>): Promise<void> => {
  try {
    const transferDoc = doc(db, "ticketTransfers", id);
    await updateDoc(transferDoc, {
      ...updatedData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating ticket transfer:", error);
    throw error;
  }
};

// Add ticket files to a transfer
export const addTicketFilesToTransfer = async (
  transferId: string, 
  ticketFiles: TicketFile[]
): Promise<void> => {
  try {
    const transferDoc = doc(db, "ticketTransfers", transferId);
    const transferSnapshot = await getDoc(transferDoc);
    
    if (!transferSnapshot.exists()) {
      throw new Error("Ticket transfer not found");
    }
    
    const existingData = transferSnapshot.data();
    const existingFiles = existingData.ticketFiles || [];
    
    await updateDoc(transferDoc, {
      ticketFiles: [...existingFiles, ...ticketFiles],
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error adding ticket files to transfer:", error);
    throw error;
  }
};

// Process ticket file with OCR
export const processTicketWithOCR = async (
  transferId: string,
  fileId: string
): Promise<any> => {
  try {
    // Placeholder for actual OCR processing
    // In a real implementation, you would:
    // 1. Get the file from storage
    // 2. Send it to an OCR service (like Google Vision API or Tesseract.js)
    // 3. Process the results and extract ticket data
    
    // For now, we'll simulate an OCR result
    const ocrResults = {
      eventName: "Sample Event",
      ticketNumber: "T" + Math.floor(Math.random() * 1000000),
      seatInfo: "Section A, Row 12, Seat 4",
      dateTime: new Date().toISOString(),
      venue: "Sample Arena",
      confidence: 0.92
    };
    
    // Update the ticket file's extracted data
    await updateTicketFileData(transferId, fileId, {
      processedStatus: 'processed',
      extractedData: ocrResults
    });
    
    // Create a verification record
    const verification: Omit<TicketVerification, 'id'> = {
      ticketTransferId: transferId,
      verificationMethod: 'ocr',
      verificationStatus: ocrResults.confidence > 0.8 ? 'verified' : 'pending',
      verificationData: ocrResults,
      verifiedAt: new Date(),
      confidenceScore: ocrResults.confidence
    };
    
    await addDoc(ticketVerificationsRef, verification);
    
    return ocrResults;
  } catch (error) {
    console.error("Error processing ticket with OCR:", error);
    
    // Update file status to failed
    await updateTicketFileData(transferId, fileId, {
      processedStatus: 'failed'
    });
    
    throw error;
  }
};

// Process QR code or barcode
export const processTicketCode = async (
  transferId: string,
  codeData: string,
  codeType: 'qrcode' | 'barcode'
): Promise<any> => {
  try {
    // In a real implementation, you would:
    // 1. Decode the QR code or barcode
    // 2. Validate it against a database of legitimate codes
    // 3. Check for duplicates or fraudulent patterns
    
    // For demonstration, we'll simulate the verification process
    
    // Check code format (this would be more sophisticated in a real app)
    const isValidFormat = /^[A-Z0-9]{10,16}$/.test(codeData);
    
    // Check against event database (placeholder)
    const isInEventDatabase = Math.random() > 0.1; // 90% chance it's valid
    
    // Check for suspicious patterns (placeholder)
    const hasSuspiciousPatterns = Math.random() < 0.05; // 5% chance it's suspicious
    
    let verificationStatus: 'verified' | 'failed' | 'flagged' = 'verified';
    let confidenceScore = 0.95;
    
    if (!isValidFormat || !isInEventDatabase) {
      verificationStatus = 'failed';
      confidenceScore = 0.3;
    } else if (hasSuspiciousPatterns) {
      verificationStatus = 'flagged';
      confidenceScore = 0.6;
    }
    
    // Create verification results
    const verificationData = {
      codeData,
      codeType,
      isValidFormat,
      isInEventDatabase,
      hasSuspiciousPatterns
    };
    
    // Create a verification record
    const verification: Omit<TicketVerification, 'id'> = {
      ticketTransferId: transferId,
      verificationMethod: codeType,
      verificationStatus,
      verificationData,
      verifiedAt: new Date(),
      confidenceScore
    };
    
    const verificationDoc = await addDoc(ticketVerificationsRef, verification);
    
    // Update the ticket transfer status if it was flagged
    if (verificationStatus === 'flagged') {
      await updateTicketTransfer(transferId, {
        status: 'flagged'
      });
    }
    
    return {
      verificationId: verificationDoc.id,
      verificationStatus,
      confidenceScore,
      details: verificationData
    };
  } catch (error) {
    console.error(`Error processing ticket ${codeType}:`, error);
    throw error;
  }
};

// Helper to update ticket file data
const updateTicketFileData = async (
  transferId: string,
  fileId: string,
  updatedData: Partial<TicketFile>
): Promise<void> => {
  try {
    const transferDoc = doc(db, "ticketTransfers", transferId);
    const transferSnapshot = await getDoc(transferDoc);
    
    if (!transferSnapshot.exists()) {
      throw new Error("Ticket transfer not found");
    }
    
    const existingData = transferSnapshot.data();
    const ticketFiles = existingData.ticketFiles || [];
    
    const updatedFiles = ticketFiles.map((file: TicketFile) => {
      if (file.id === fileId) {
        return { ...file, ...updatedData };
      }
      return file;
    });
    
    await updateDoc(transferDoc, {
      ticketFiles: updatedFiles,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating ticket file data:", error);
    throw error;
  }
};

// Get all verifications for a ticket transfer
export const getTicketVerifications = async (transferId: string): Promise<TicketVerification[]> => {
  try {
    const q = query(ticketVerificationsRef, where("ticketTransferId", "==", transferId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TicketVerification));
  } catch (error) {
    console.error("Error getting ticket verifications:", error);
    throw error;
  }
};

// Get a single ticket transfer by ID
export const getTicketTransfer = async (id: string): Promise<TicketTransfer | null> => {
  try {
    const transferDoc = doc(db, "ticketTransfers", id);
    const transferSnapshot = await getDoc(transferDoc);
    
    if (!transferSnapshot.exists()) {
      return null;
    }
    
    return {
      id: transferSnapshot.id,
      ...transferSnapshot.data()
    } as TicketTransfer;
  } catch (error) {
    console.error("Error getting ticket transfer:", error);
    throw error;
  }
};

// Check if a ticket is potentially fraudulent
export const checkTicketFraudRisk = async (
  ticketData: any
): Promise<{ riskLevel: 'low' | 'medium' | 'high', reasons: string[] }> => {
  // In a real implementation, this would use ML models, pattern recognition,
  // and historical data to identify potential fraud
  
  const reasons: string[] = [];
  let riskScore = 0;
  
  // Example risk factors (placeholders)
  if (!ticketData.eventId || !ticketData.ticketNumber) {
    reasons.push("Missing critical ticket information");
    riskScore += 30;
  }
  
  if (ticketData.price && ticketData.originalPrice && 
      ticketData.price < ticketData.originalPrice * 0.5) {
    reasons.push("Ticket price significantly below market value");
    riskScore += 15;
  }
  
  if (ticketData.seller && ticketData.seller.accountAge < 30) {
    reasons.push("Seller account created recently");
    riskScore += 10;
  }
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (riskScore >= 40) {
    riskLevel = 'high';
  } else if (riskScore >= 20) {
    riskLevel = 'medium';
  }
  
  return {
    riskLevel,
    reasons: reasons.length > 0 ? reasons : ["No risk factors identified"]
  };
};

// Validate a resale ticket
export const validateResaleTicket = async (
  ticketFile: File | null,
  ticketCode: string | null,
  validationId: string,
  validationType: 'digital' | 'physical'
): Promise<{verificationStatus: string, confidenceScore: number}> => {
  try {
    if (validationType === 'digital' && ticketFile) {
      // Upload and process digital ticket
      const uploadedFile = await uploadTicketFile(ticketFile, validationId);
      
      // Process with OCR
      return await processTicketWithOCR(validationId, uploadedFile.id || 'temp');
    } else if (validationType === 'physical' && ticketCode) {
      // Process physical ticket code
      const codeType = ticketCode.length > 20 ? 'qrcode' : 'barcode';
      return await processTicketCode(validationId, ticketCode, codeType);
    } else {
      throw new Error('Invalid validation parameters');
    }
  } catch (error) {
    console.error("Error validating resale ticket:", error);
    return {
      verificationStatus: 'failed',
      confidenceScore: 0
    };
  }
};
