import { db, storage } from './firebase';
import { collection, doc, setDoc, getDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { VerificationData, VerificationSubmission } from '../models/verification';

// Maximum retries for upload
const MAX_UPLOAD_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

// Check if the storage emulator is available
const isEmulatorAvailable = (): boolean => {
  try {
    // The storage._delegate._url should contain the emulator URL if connected
    return (storage as any)._delegate._url?.includes('localhost') || 
           (storage as any)._delegate._url?.includes('github.dev');
  } catch (e) {
    return false;
  }
};

// Helper function to add delay between retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const verificationCollection = 'userVerifications';

/**
 * Check if a user has already been verified
 * @param userId The user's ID
 * @returns Object with isVerified status and verification data if available
 */
export const checkUserVerification = async (userId: string): Promise<{
  isVerified: boolean;
  verificationData?: VerificationData;
  status?: 'pending' | 'approved' | 'rejected';
}> => {
  try {
    const verificationRef = doc(db, verificationCollection, userId);
    const verificationDoc = await getDoc(verificationRef);
    
    if (verificationDoc.exists()) {
      const data = verificationDoc.data() as VerificationData;
      return {
        isVerified: data.status === 'approved',
        verificationData: data,
        status: data.status
      };
    }
    
    return { isVerified: false };
  } catch (error) {
    console.error('Error checking user verification:', error);
    return { isVerified: false };
  }
};

/**
 * Submit verification data for a user
 * @param userId The user's ID
 * @param verificationData The verification data to submit
 * @returns Promise that resolves when the submission is complete
 */
export const submitVerification = async (userId: string, submission: VerificationSubmission): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. Upload ID document if provided, or use direct URL if available
    let idDocumentUrl = submission.idDocumentDirectUrl;
    
    if (!idDocumentUrl && submission.idDocument) {
      const timestamp = new Date().getTime();
      const fileName = `verification_docs/${userId}/${timestamp}_id.${submission.idDocument.name.split('.').pop()}`;
      const storageRef = ref(storage, fileName);
      
      // Check if using emulator - use appropriate upload method
      if (isEmulatorAvailable()) {
        console.log('Using emulator for upload');
        // Use uploadBytesResumable for better progress tracking and error handling
        const uploadTask = uploadBytesResumable(storageRef, submission.idDocument, {
          contentType: submission.idDocument.type,
          customMetadata: {
            'fileName': submission.idDocument.name,
            'userId': userId,
            'timestamp': timestamp.toString(),
            'source': 'verification-upload-emulator'
          }
        });
        
        // Wait for completion
        await uploadTask;
        idDocumentUrl = await getDownloadURL(storageRef);
      } else {
        console.log('Using production upload with retry logic');
        // Use uploadBytes with retry logic for production
        let uploadSuccess = false;
        let lastError = null;
        let retries = MAX_UPLOAD_RETRIES;
        
        while (retries > 0 && !uploadSuccess) {
          try {
            // Add specific content type and metadata
            await uploadBytes(storageRef, submission.idDocument, {
              contentType: submission.idDocument.type,
              customMetadata: {
                'fileName': submission.idDocument.name,
                'userId': userId,
                'timestamp': timestamp.toString(),
                'source': 'verification-upload'
              }
            });
            
            // Get the download URL
            idDocumentUrl = await getDownloadURL(storageRef);
            uploadSuccess = true;
          } catch (err) {
            lastError = err;
            retries--;
            console.log(`Upload attempt failed, retries left: ${retries}`);
            if (retries > 0) {
              await delay(RETRY_DELAY);
            }
          }
        }
        
        if (!uploadSuccess) {
          console.error('All upload attempts failed:', lastError);
          return { 
            success: false, 
            error: lastError instanceof Error ? lastError.message : 'Failed to upload verification document after multiple attempts'
          };
        }
      }
    }
    
    // 2. Create verification record in Firestore
    const verificationData: VerificationData = {
      userId,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      
      // Identity verification
      fullName: submission.fullName,
      idType: submission.idType,
      idNumber: submission.idNumber,
      idDocumentUrl,
      
      // Banking information
      accountHolderName: submission.accountHolderName,
      accountType: submission.accountType,
      bankName: submission.bankName,
      accountNumber: submission.accountNumber,
      branchNumber: submission.branchNumber, // Use branchNumber instead of routingNumber
      
      // Additional metadata
      address: submission.address
    };
    
    // 3. Save to Firestore
    const verificationRef = doc(db, verificationCollection, userId);
    await setDoc(verificationRef, verificationData);
    
    return { success: true };
  } catch (error) {
    console.error('Error submitting verification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit verification'
    };
  }
};

/**
 * Update the status of a verification request (admin function)
 * @param userId The user's ID
 * @param status The new status
 * @param notes Optional review notes
 * @returns Promise that resolves when the update is complete
 */
export const updateVerificationStatus = async (
  userId: string, 
  status: 'approved' | 'rejected',
  notes?: string
): Promise<void> => {
  try {
    const verificationRef = doc(db, verificationCollection, userId);
    await updateDoc(verificationRef, {
      status,
      reviewedAt: new Date().toISOString(),
      reviewNotes: notes
    });
  } catch (error) {
    console.error('Error updating verification status:', error);
    throw error;
  }
};

/**
 * Get all pending verification requests (admin function)
 * @returns Promise with an array of verification data
 */
export const getPendingVerifications = async (): Promise<VerificationData[]> => {
  try {
    const verificationRef = collection(db, verificationCollection);
    const q = query(verificationRef, where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    
    const verifications: VerificationData[] = [];
    querySnapshot.forEach((doc) => {
      verifications.push(doc.data() as VerificationData);
    });
    
    return verifications;
  } catch (error) {
    console.error('Error getting pending verifications:', error);
    throw error;
  }
};
