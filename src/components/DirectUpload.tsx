import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';

interface DirectUploadProps {
  userId: string;
  onUploadSuccess: (url: string) => void;
  onUploadError: (error: string) => void;
}

const DirectUpload: React.FC<DirectUploadProps> = ({ userId, onUploadSuccess, onUploadError }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('No file selected');
      onUploadError('No file selected');
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadError(null);

    try {
      const timestamp = new Date().getTime();
      const fileName = `verification_docs/${userId}/${timestamp}_id.${selectedFile.name.split('.').pop()}`;
      const storageRef = ref(storage, fileName);

      // Use uploadBytesResumable for progress tracking
      const uploadTask = uploadBytesResumable(storageRef, selectedFile, {
        contentType: selectedFile.type,
        customMetadata: {
          'fileName': selectedFile.name,
          'userId': userId,
          'timestamp': timestamp.toString(),
          'source': 'direct-upload-component'
        }
      });

      // Track upload progress
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setProgress(progress);
        },
        (error) => {
          console.error('Upload failed:', error);
          setUploadError(error.message || 'Upload failed');
          onUploadError(error.message || 'Upload failed');
          setUploading(false);
        }
      );

      // Wait for upload to complete
      await uploadTask;

      // Get download URL
      const downloadUrl = await getDownloadURL(storageRef);
      setUploading(false);
      setProgress(100);
      onUploadSuccess(downloadUrl);
    } catch (err) {
      setUploading(false);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      console.error('Upload failed:', err);
      setUploadError(errorMessage);
      onUploadError(errorMessage);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-medium mb-2">
        Direct File Upload
      </label>
      <div className="flex items-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="ml-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      {uploading && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
            <div
              className="bg-indigo-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Uploading... {progress}%</p>
        </div>
      )}
      {uploadError && (
        <div className="mt-2 bg-red-50 p-3 rounded-md">
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}
      {selectedFile && (
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
          </p>
        </div>
      )}
    </div>
  );
};

export default DirectUpload;
