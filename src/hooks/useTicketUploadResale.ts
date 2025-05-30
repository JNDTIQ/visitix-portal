import { useState } from 'react';
import { ref, getDownloadURL, uploadString } from 'firebase/storage';
import { storage } from '../services/firebase';

interface UseTicketUploadResult {
  uploading: boolean;
  error: string | null;
  success: boolean;
  uploadFiles: (files: File[]) => Promise<string[]>;
  getUploadedUrls: () => string[];
  resetSuccess: () => void;
}

export const useTicketUploadResale = (): UseTicketUploadResult => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    
    setUploading(true);
    setError(null);
    const urls: string[] = [];
    
    try {
      // Generate placeholder URLs for immediate use
      const placeholderUrls = files.map((file, index) => {
        const timestamp = new Date().getTime();
        const randomId = Math.floor(Math.random() * 1000000000);
        const fileName = `resale_tickets/${timestamp}_${randomId}.${file.name.split('.').pop()}`;
        return `placeholder-${timestamp}-${index}-${fileName}`;
      });
      
      for (const file of files) {
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
            'source': 'resale-upload'
          }
        };
        
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
              
              try {
                // Add a small delay between uploads to prevent CORS race conditions
                await delay(500);
                
                // Upload the file as a base64 string with retry logic
                let retries = 3;
                let success = false;
                let lastError = null;
                
                while (retries > 0 && !success) {
                  try {
                    await uploadString(storageRef, base64String, 'base64', metadata);
                    success = true;
                  } catch (uploadErr) {
                    lastError = uploadErr;
                    retries--;
                    // Wait longer between retries
                    await delay(1000);
                  }
                }
                
                if (!success) {
                  throw lastError || new Error('Upload failed after retries');
                }
              
                // Get the download URL
                const downloadUrl = await getDownloadURL(storageRef);
                resolve(downloadUrl);
              } catch (uploadErr) {
                console.error('Error during upload:', uploadErr);
                reject(uploadErr);
              }
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = (err) => reject(err);
        });
        
        reader.readAsDataURL(file);
        const downloadUrl = await fileUploadPromise;
        urls.push(downloadUrl);
      }
      
      setUploadedUrls(urls);
      setSuccess(true);
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload files');
      setSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  const getUploadedUrls = (): string[] => {
    return uploadedUrls;
  };
  
  const resetSuccess = () => {
    setSuccess(false);
  };
  
  const verifyUploads = async (): Promise<boolean> => {
    // Implementation remains as is
    return true;
  };

  return {
    uploading,
    error,
    success,
    uploadFiles,
    getUploadedUrls,
    resetSuccess,
    verifyUploads
  };
};
