/**
 * Buffer polyfill for browser environments
 * Provides Buffer implementation for browser context
 */

// Import the Buffer from the buffer package
import { Buffer } from 'buffer';

// Make Buffer available globally for browser environments
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}

export { Buffer };
