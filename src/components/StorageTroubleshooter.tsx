import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';

interface ConnectionStatus {
  firebase: boolean;
  storage: boolean;
  upload: boolean;
  cors: boolean;
}

const StorageTroubleshooter: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    firebase: false,
    storage: false,
    upload: false,
    cors: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isEmulator, setIsEmulator] = useState<boolean | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().slice(11, 19)} - ${message}`]);
  };

  const runTests = async () => {
    setLoading(true);
    setError(null);
    setLogs([]);
    
    try {
      // Test 1: Check Firebase connectivity
      addLog('Testing Firebase connectivity...');
      
      const firebaseConfig = (window as any).firebaseConfig;
      const isConfigured = !!firebaseConfig && !!firebaseConfig.apiKey;
      
      if (isConfigured) {
        addLog('✅ Firebase configuration detected');
        setStatus(prev => ({ ...prev, firebase: true }));
      } else {
        addLog('❌ Firebase configuration not detected');
        throw new Error('Firebase configuration not detected');
      }
      
      // Test 2: Check Storage connectivity
      addLog('Testing Firebase Storage connectivity...');
      
      try {
        const testRef = ref(storage, '_test');
        const isConnected = !!testRef;
        
        if (isConnected) {
          addLog('✅ Firebase Storage connected');
          setStatus(prev => ({ ...prev, storage: true }));
          
          // Check if using emulator
          const isUsingEmulator = (storage as any)._delegate._appCheckInstances === undefined;
          setIsEmulator(isUsingEmulator);
          addLog(`ℹ️ Using Firebase Storage ${isUsingEmulator ? 'emulator' : 'production'}`);
        } else {
          addLog('❌ Firebase Storage connection failed');
          throw new Error('Firebase Storage connection failed');
        }
      } catch (err) {
        addLog(`❌ Storage error: ${err instanceof Error ? err.message : String(err)}`);
        throw err;
      }
      
      // Test 3: Create a tiny file and try to upload it
      addLog('Testing file upload capabilities...');
      
      try {
        // Create a tiny text file
        const blob = new Blob(['test'], { type: 'text/plain' });
        const testFile = new File([blob], 'test.txt', { type: 'text/plain' });
        
        // Try to upload it
        const timestamp = Date.now();
        const testRef = ref(storage, `_troubleshoot/test-${timestamp}.txt`);
        
        addLog('Starting upload...');
        const uploadTask = uploadBytesResumable(testRef, testFile);
        
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              addLog(`Upload progress: ${progress}%`);
            },
            (error) => {
              addLog(`❌ Upload failed: ${error.message}`);
              reject(error);
            },
            () => {
              addLog('✅ Upload completed successfully');
              setStatus(prev => ({ ...prev, upload: true }));
              resolve();
            }
          );
        });
        
        // Try to get the download URL to test CORS
        addLog('Testing download URL (CORS)...');
        const url = await getDownloadURL(testRef);
        addLog(`✅ Got download URL: ${url.substring(0, 50)}...`);
        setStatus(prev => ({ ...prev, cors: true }));
        
      } catch (err) {
        addLog(`❌ File operation error: ${err instanceof Error ? err.message : String(err)}`);
        
        if (err instanceof Error && err.message.includes('CORS')) {
          addLog('⚠️ CORS error detected. Your Firebase Storage CORS settings need to be updated.');
        }
        
        throw err;
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      addLog(`❌ Test failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Firebase Storage Troubleshooter</h2>
      
      <div className="mb-4">
        <button
          onClick={runTests}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
        >
          {loading ? 'Running Tests...' : 'Run Tests'}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`p-4 border rounded-md ${status.firebase ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className="font-medium">Firebase Connection</h3>
          <p className="text-sm">{status.firebase ? '✅ Connected' : '⏳ Not tested'}</p>
        </div>
        
        <div className={`p-4 border rounded-md ${status.storage ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className="font-medium">Storage Connection</h3>
          <p className="text-sm">{status.storage ? '✅ Connected' : '⏳ Not tested'}</p>
          {isEmulator !== null && (
            <p className="text-xs mt-1">{isEmulator ? '🧪 Using emulator' : '🌐 Using production'}</p>
          )}
        </div>
        
        <div className={`p-4 border rounded-md ${status.upload ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className="font-medium">Upload Test</h3>
          <p className="text-sm">{status.upload ? '✅ Success' : '⏳ Not tested'}</p>
        </div>
        
        <div className={`p-4 border rounded-md ${status.cors ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className="font-medium">CORS Configuration</h3>
          <p className="text-sm">{status.cors ? '✅ Properly configured' : '⏳ Not tested'}</p>
        </div>
      </div>
      
      <div>
        <h3 className="font-medium mb-2">Test Logs:</h3>
        <div className="bg-gray-900 text-gray-100 rounded-md p-4 font-mono text-sm h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">Run tests to see logs...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>
      
      {!status.cors && status.upload === false && (
        <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-500">
          <h3 className="font-medium text-yellow-800">Troubleshooting Tips:</h3>
          <ul className="list-disc list-inside text-sm text-yellow-700 mt-2">
            <li>Make sure your CORS configuration is properly set up</li>
            <li>Try using the Storage emulator for local development</li>
            <li>Check if your Firebase Storage rules allow uploads</li>
            <li>Consider using direct uploads with uploadBytesResumable</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default StorageTroubleshooter;
