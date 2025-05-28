/**
 * Simple polyfill for crypto module in browser environments
 * This uses the browser's native Web Crypto API instead of Node.js crypto
 */

// Export a subset of the crypto API that we need
export default {
  // Use browser's crypto.getRandomValues for random bytes
  randomBytes: (size: number) => {
    const array = new Uint8Array(size);
    window.crypto.getRandomValues(array);
    return array;
  },
  
  // Other methods from crypto we might need can be added here
  createHash: (algorithm: string) => {
    // In a real app, implement a proper hash function that works in browser
    // For this demo, we'll just throw an error because we don't actually use this
    throw new Error('Hash function not implemented in browser environment');
  },
  
  // Add any other crypto methods needed by our application
};
