import { useState, useCallback } from 'react';
import { 
  processTicketFile, 
  OCRResult
} from '../utils/ticketProcessing';
import { uploadTicketFile } from '../services/ticketTransferService';

interface FileProcessingResult {
  id?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string;
  uploadedAt: Date;
  processedStatus: 'pending' | 'processing' | 'processed' | 'failed';
  processingError?: string;
  previewUrl?: string;
  extractedData?: any;
  qrCodeData?: string;
}

interface UseTicketUploadResult {
  files: FileProcessingResult[];
  isProcessing: boolean;
  error: string | null;
  addFiles: (newFiles: File[]) => void;
  removeFile: (index: number) => void;
  uploadFiles: (transferId: string) => Promise<FileProcessingResult[]>;
  clearFiles: () => void;
}

/**
 * Custom hook for handling ticket file uploads and processing
 */
export const useTicketUpload = (): UseTicketUploadResult => {
  const [files, setFiles] = useState<FileProcessingResult[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Add files to the queue
  const addFiles = useCallback((newFiles: File[]) => {
    // Create preview URLs and initial metadata
    const processedFiles = newFiles.map((file) => {
      return {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date(),
        processedStatus: 'pending' as const,
        previewUrl: URL.createObjectURL(file),
        // Store the original file in a non-enumerable property
        // so it doesn't get serialized but is still accessible
        get originalFile() { return file; },
      };
    });

    setFiles((prevFiles) => [...prevFiles, ...processedFiles]);
  }, []);

  // Remove a file from the queue
  const removeFile = useCallback((index: number) => {
    setFiles((prevFiles) => {
      // Revoke the preview URL to avoid memory leaks
      const file = prevFiles[index];
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
      return prevFiles.filter((_, i) => i !== index);
    });
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    // Revoke all preview URLs
    files.forEach((file) => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });
    setFiles([]);
  }, [files]);

  // Upload and process all files for a ticket transfer
  const uploadFiles = useCallback(async (transferId: string): Promise<FileProcessingResult[]> => {
    if (files.length === 0) {
      setError('No files to upload');
      return [];
    }

    setIsProcessing(true);
    setError(null);

    const updatedFiles = [...files];
    const results: FileProcessingResult[] = [];

    try {
      // Process each file one by one
      for (let i = 0; i < updatedFiles.length; i++) {
        const file = updatedFiles[i];
        const originalFile = (file as any).originalFile as File;

        // Update status to processing
        updatedFiles[i] = { ...file, processedStatus: 'processing' };
        setFiles(updatedFiles);

        try {
          // Upload the file to Firebase Storage
          const uploadResult = await uploadTicketFile(originalFile, transferId);

          // Process the file for OCR or QR code
          const processingResult = await processTicketFile(originalFile);

          // Update file with processing results
          const updatedFile: FileProcessingResult = {
            ...file,
            ...uploadResult,
            processedStatus: 'processed',
            extractedData: processingResult.type === 'ocr' ? processingResult.recognizedStructures : null,
            qrCodeData: processingResult.type === 'qrcode' ? processingResult.data : null
          };

          updatedFiles[i] = updatedFile;
          results.push(updatedFile);
        } catch (err) {
          console.error('Error processing file:', err);
          
          // Update file with error
          updatedFiles[i] = {
            ...file, 
            processedStatus: 'failed',
            processingError: err instanceof Error ? err.message : 'Unknown error'
          };
        }

        // Update the state after each file
        setFiles([...updatedFiles]);
      }

      return results;
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload files');
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, [files]);

  return {
    files,
    isProcessing,
    error,
    addFiles,
    removeFile,
    uploadFiles,
    clearFiles
  };
};
