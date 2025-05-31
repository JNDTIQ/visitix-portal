// Helper functions for connecting to Firebase Storage emulator
import { connectStorageEmulator } from "firebase/storage";
import { storage } from './firebase';

// Connect to storage emulator when in development mode
export const setupStorageEmulator = () => {
  const isLocalhost = window.location.hostname === 'localhost';
  const isCodespace = window.location.hostname.includes('github.dev') || 
                      window.location.hostname.includes('gitpod.io');
                     
  if (isLocalhost || isCodespace) {
    try {
      // For GitHub Codespaces, we need to use the same hostname as the app
      // This is because the browser cannot access 'localhost' of the codespace directly
      const host = isCodespace ? window.location.hostname : 'localhost';
      const port = isCodespace ? 9199 : 9199; // Use the forwarded port for codespaces

      console.log(`Attempting to connect to Storage emulator at ${host}:${port}`);
      connectStorageEmulator(storage, host, port);
      console.log('Connected to Firebase Storage emulator');
    } catch (error) {
      console.warn('Failed to connect to Firebase Storage emulator:', error);
    }
  }
};
