import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface UseTicketUploadResult {
  uploading: boolean;
  error: string | null;
  uploadFiles: (files: File[]) => Promise<void>;
  getUploadedUrls: () => string[];
}

export const useTicketUpload = (): UseTicketUploadResult => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const uploadFiles = async (files: File[]): Promise<void> => {
    if (files.length === 0) return;
    
    setUploading(true);
    setError(null);
    const urls: string[] = [];
    
    try {
      const storage = getStorage();
      
      for (const file of files) {
        // Create a storage reference with a unique name
        const timestamp = new Date().getTime();
        const fileName = `resale_tickets/${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storageRef = ref(storage, fileName);
        
        // Upload the file
        await uploadBytes(storageRef, file);
        
        // Get the download URL
        const downloadUrl = await getDownloadURL(storageRef);
        urls.push(downloadUrl);
      }
      
      setUploadedUrls(urls);
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const getUploadedUrls = (): string[] => {
    return uploadedUrls;
  };

  return {
    uploading,
    error,
    uploadFiles,
    getUploadedUrls
  };
};
