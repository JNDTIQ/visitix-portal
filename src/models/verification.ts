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
  routingNumber: string;
  
  // Additional metadata
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
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
  
  accountHolderName: string;
  accountType: 'checking' | 'savings';
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}
