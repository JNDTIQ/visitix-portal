import { db, storage } from './firebase';
import { collection, doc, setDoc, getDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { VerificationData, VerificationSubmission } from '../models/verification';

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
    // 1. Upload ID document if provided
    let idDocumentUrl;
    if (submission.idDocument) {
      const timestamp = new Date().getTime();
      const fileName = `verification_docs/${userId}/${timestamp}_id.${submission.idDocument.name.split('.').pop()}`;
      const storageRef = ref(storage, fileName);
      
      // Convert file to base64 string and upload
      const reader = new FileReader();
      const fileUploadPromise = new Promise<string>((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            if (!e.target || typeof e.target.result !== 'string') {
              throw new Error('Failed to read file');
            }
            
            // Get the base64 string (remove the data URL prefix)
            const base64String = e.target.result.split(',')[1];
            
            // Set metadata to indicate the file type
            const metadata = {
              contentType: submission.idDocument!.type,
              customMetadata: {
                'fileName': submission.idDocument!.name,
                'userId': userId
              }
            };
            
            // Upload the file as a base64 string
            await uploadString(storageRef, base64String, 'base64', metadata);
            
            // Get the download URL
            const downloadUrl = await getDownloadURL(storageRef);
            resolve(downloadUrl);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = (err) => reject(err);
      });
      
      reader.readAsDataURL(submission.idDocument);
      idDocumentUrl = await fileUploadPromise;
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
      routingNumber: submission.routingNumber,
      
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
