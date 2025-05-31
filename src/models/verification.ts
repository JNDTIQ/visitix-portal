export interface VerificationData {
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  
  // Identity verification
  fullName: string;
  idType: 'passport' | 'driverLicense' | 'nationalId' | 'other';
  idNumber: string;
  idDocumentUrl?: string;
  
  // Banking information
  accountHolderName: string;
  accountType: 'checking' | 'savings';
  bankName: string;
  accountNumber: string;
  branchNumber: string; // Changed from routingNumber to branchNumber
  
  // Additional metadata
  address?: {
    street: string;
    streetDetails: string; // New field for additional street details
    parish: string; // New field for Jamaican parish
    city: string;
    country: string;
  };
  
  // For storing any comments from the verification team
  reviewNotes?: string;
}

export interface VerificationSubmission {
  fullName: string;
  idType: 'passport' | 'driverLicense' | 'nationalId' | 'other';
  idNumber: string;
  idDocument?: File;
  idDocumentDirectUrl?: string; // Direct URL for uploads that bypassed the normal flow
  
  accountHolderName: string;
  accountType: 'checking' | 'savings';
  bankName: string;
  accountNumber: string;
  branchNumber: string; // Changed from routingNumber to branchNumber
  
  address?: {
    street: string;
    streetDetails: string; // New field for additional street details
    parish: string; // New field for Jamaican parish
    city: string;
    country: string;
  };
}
