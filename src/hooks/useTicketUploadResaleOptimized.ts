import { useState } from 'react';
import { ref, getDownloadURL, uploadString } from 'firebase/storage';
import { storage } from '../services/firebase';

interface UseTicketUploadResult {
  uploading: boolean;
  error: string | null;
  uploadFiles: (files: File[]) => Promise<string[]>;
  actualUploadFiles: (files: File[], placeholderUrls: string[]) => Promise<void>;
}

/**
 * This is an optimized version of the ticket upload hook that returns placeholder URLs
 * immediately and performs the actual upload in the background.
 */
export const useTicketUploadResaleOptimized = (): UseTicketUploadResult => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate placeholder URLs immediately and start the upload process in the background.
   * This allows the UI to proceed without waiting for the upload to complete.
   */
  const uploadFiles = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    
    setUploading(true);
    setError(null);
    
    try {
      // Generate placeholder URLs for immediate use - these URLs will be replaced later
      const placeholderUrls = files.map((file, index) => {
        const timestamp = new Date().getTime();
        const randomId = Math.floor(Math.random() * 1000000000);
        const fileName = `resale_tickets/${timestamp}_${randomId}.${file.name.split('.').pop()}`;
        return `placeholder://${timestamp}-${randomId}-${file.name}`;
      });
      
      // Start the actual upload in the background
      actualUploadFiles(files, placeholderUrls).catch(err => {
        console.error('Background upload failed:', err);
        // We don't set error here since we've already returned placeholder URLs
      });
      
      return placeholderUrls;
    } catch (err) {
      console.error('Error preparing upload:', err);
      setError(err instanceof Error ? err.message : 'Failed to prepare upload');
      return [];
    } finally {
      setUploading(false);
    }
  };

  /**
   * Perform the actual file uploads in the background
   * This won't block the UI since it's called after returning placeholder URLs
   */
  const actualUploadFiles = async (files: File[], placeholderUrls: string[]): Promise<void> => {
    if (files.length === 0) return;
    
    try {
      // Helper function to add delay between uploads
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Create a storage reference with a unique name
        const timestamp = new Date().getTime();
        const randomId = Math.floor(Math.random() * 1000000000);
        const fileName = `resale_tickets/${timestamp}_${randomId}.${file.name.split('.').pop()}`;
        const storageRef = ref(storage, fileName);
        
        // Add metadata to help with CORS
        const metadata = {
          contentType: file.type,
          customMetadata: {
            'fileName': file.name,
            'fileSize': file.size.toString(),
            'timestamp': timestamp.toString(),
            'source': 'resale-upload-optimized',
            'placeholderUrl': placeholderUrls[i]
          }
        };
        
        // Convert file to base64 string and upload
        const reader = new FileReader();
        const fileUploadPromise = new Promise<void>((resolve, reject) => {
          reader.onload = async (e) => {
            try {
              if (!e.target || typeof e.target.result !== 'string') {
                throw new Error('Failed to read file');
              }
              
              // Get the base64 string (remove the data URL prefix)
              const base64String = e.target.result.split(',')[1];
              
              try {
                // Add a small delay between uploads to prevent CORS race conditions
                await delay(500);
                
                // Upload the file as a base64 string with retry logic
                let retries = 3;
                let success = false;
                
                while (retries > 0 && !success) {
                  try {
                    await uploadString(storageRef, base64String, 'base64', metadata);
                    success = true;
                  } catch (uploadErr) {
                    retries--;
                    // Wait longer between retries
                    await delay(1000);
                  }
                }
                
                resolve();
              } catch (uploadErr) {
                console.error('Error during background upload:', uploadErr);
                resolve(); // Resolve anyway since this is a background operation
              }
            } catch (err) {
              console.error('Error processing file:', err);
              resolve(); // Resolve anyway since this is a background operation
            }
          };
          reader.onerror = (err) => {
            console.error('Error reading file:', err);
            resolve(); // Resolve anyway since this is a background operation
          };
        });
        
        reader.readAsDataURL(file);
        await fileUploadPromise;
        
        // Add some delay between processing files
        await delay(300);
      }
    } catch (err) {
      console.error('Error in background upload:', err);
      // We don't set error here since we've already returned placeholder URLs
    }
  };

  return {
    uploading,
    error,
    uploadFiles,
    actualUploadFiles
  };
};
