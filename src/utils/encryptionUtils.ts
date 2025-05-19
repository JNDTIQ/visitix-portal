/**
 * Utility functions for encrypting and decrypting sensitive ticket data
 * Using the Web Crypto API for browser compatibility
 */

// Encrypt data using the Web Crypto API
export const encryptData = async (data: string, key: CryptoKey): Promise<string> => {
  try {
    // Convert data to ArrayBuffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate a random IV (Initialization Vector)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      dataBuffer
    );
    
    // Combine IV and encrypted data
    const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encryptedBuffer), iv.length);
    
    // Convert to base64 string for storage
    return btoa(String.fromCharCode(...Array.from(result)));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt data using the Web Crypto API
export const decryptData = async (encryptedData: string, key: CryptoKey): Promise<string> => {
  try {
    // Convert from base64 to ArrayBuffer
    const encryptedBytes = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    
    // Extract IV and encrypted data
    const iv = encryptedBytes.slice(0, 12);
    const data = encryptedBytes.slice(12);
    
    // Decrypt the data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      data
    );
    
    // Convert ArrayBuffer to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Generate a new encryption key using Web Crypto API
export const generateEncryptionKey = async (): Promise<CryptoKey> => {
  try {
    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Key generation error:', error);
    throw new Error('Failed to generate encryption key');
  }
};

// Export a key for safe storage (e.g., in localStorage)
export const exportKey = async (key: CryptoKey): Promise<string> => {
  try {
    const exportedKey = await window.crypto.subtle.exportKey('raw', key);
    const keyArray = Array.from(new Uint8Array(exportedKey));
    return btoa(String.fromCharCode(...keyArray));
  } catch (error) {
    console.error('Key export error:', error);
    throw new Error('Failed to export key');
  }
};

// Import a key from storage
export const importKey = async (keyData: string): Promise<CryptoKey> => {
  try {
    const keyBytes = new Uint8Array(
      atob(keyData).split('').map(char => char.charCodeAt(0))
    );
    
    return await window.crypto.subtle.importKey(
      'raw',
      keyBytes,
      {
        name: 'AES-GCM',
        length: 256
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Key import error:', error);
    throw new Error('Failed to import key');
  }
};

// Helper function to get or create a session key
export const getSessionKey = async (): Promise<CryptoKey> => {
  try {
    // Check if a key already exists in session storage
    const storedKey = sessionStorage.getItem('ticketEncryptionKey');
    
    if (storedKey) {
      // Import the existing key
      return await importKey(storedKey);
    } else {
      // Generate a new key
      const newKey = await generateEncryptionKey();
      
      // Export and store the key
      const exportedKey = await exportKey(newKey);
      sessionStorage.setItem('ticketEncryptionKey', exportedKey);
      
      return newKey;
    }
  } catch (error) {
    console.error('Session key error:', error);
    throw new Error('Failed to get or create session key');
  }
};

// Encrypt a ticket object
export const encryptTicket = async (ticketData: any): Promise<string> => {
  try {
    // Get the session key
    const key = await getSessionKey();
    
    // Stringify the ticket data
    const ticketString = JSON.stringify(ticketData);
    
    // Encrypt the data
    return await encryptData(ticketString, key);
  } catch (error) {
    console.error('Ticket encryption error:', error);
    throw new Error('Failed to encrypt ticket data');
  }
};

// Decrypt a ticket object
export const decryptTicket = async (encryptedTicket: string): Promise<any> => {
  try {
    // Get the session key
    const key = await getSessionKey();
    
    // Decrypt the data
    const ticketString = await decryptData(encryptedTicket, key);
    
    // Parse the JSON
    return JSON.parse(ticketString);
  } catch (error) {
    console.error('Ticket decryption error:', error);
    throw new Error('Failed to decrypt ticket data');
  }
};
