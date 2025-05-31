import React from 'react';
import StorageTroubleshooter from '../components/StorageTroubleshooter';
import DirectUpload from '../components/DirectUpload';
import { useAuth } from '../contexts/AuthContext';

const TroubleshootPage: React.FC = () => {
  const { currentUser } = useAuth();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Firebase Storage Troubleshooting</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <StorageTroubleshooter />
        </div>
        
        <div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Test Direct Upload</h2>
            <p className="mb-4 text-gray-600">
              Use this direct upload component to test if uploads work with the optimized method.
              This bypasses some CORS issues by using uploadBytesResumable.
            </p>
            
            {currentUser ? (
              <DirectUpload 
                userId={currentUser.uid}
                onUploadSuccess={(url) => {
                  console.log('Upload succeeded:', url);
                  alert('Upload succeeded! URL: ' + url);
                }}
                onUploadError={(error) => {
                  console.error('Upload error:', error);
                  alert('Upload failed: ' + error);
                }}
              />
            ) : (
              <div className="p-4 bg-yellow-50 rounded-md">
                <p className="text-yellow-700">Please log in to test uploads.</p>
              </div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md mt-6">
            <h2 className="text-xl font-semibold mb-4">CORS Explainer</h2>
            <p className="text-gray-600 mb-2">
              CORS (Cross-Origin Resource Sharing) errors happen when your web app tries to make requests to a 
              different domain than the one it's hosted on.
            </p>
            <p className="text-gray-600 mb-2">
              For Firebase Storage, you need to configure CORS settings to allow your development domain to access the storage bucket.
            </p>
            <div className="bg-gray-100 p-4 rounded-md">
              <p className="font-medium">How to fix:</p>
              <ol className="list-decimal list-inside text-sm mt-2">
                <li>Use the Firebase Storage emulator for local development</li>
                <li>Update your CORS configuration in the Firebase console</li>
                <li>Add your development domain to the allowed origins</li>
                <li>Make sure OPTIONS requests are allowed</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TroubleshootPage;
