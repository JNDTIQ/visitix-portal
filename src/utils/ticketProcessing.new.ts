import Tesseract from 'tesseract.js';
import jsQR from 'jsqr';
import * as fileType from 'file-type';
import * as pdfjs from 'pdfjs-dist';
// Import the Buffer polyfill
import { Buffer } from '../utils/buffer-polyfill';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Interface for processed OCR result
export interface OCRResult {
  text: string;
  confidence: number;
  blocks: any[];
  recognizedStructures: {
    eventName?: string;
    eventDate?: string;
    ticketId?: string;
    seatInfo?: string;
    price?: string;
    barcode?: string;
    venueInfo?: string;
  };
  originalImageUrl?: string;
}

/**
 * Processes an image file with OCR to extract ticket information
 */
export const processImageWithOCR = async (imageFile: File): Promise<OCRResult> => {
  try {
    // Create a URL for the image
    const imageUrl = URL.createObjectURL(imageFile);
    
    // Process with Tesseract
    const result = await Tesseract.recognize(
      imageUrl,
      'eng', // language
      {
        logger: m => console.log(m) // Optional logger for progress
      }
    );
    
    // Extract structured information from OCR text
    const recognizedStructures = extractStructuredInfoFromOCR(result.data.text);
    
    // Create the result object
    const ocrResult: OCRResult = {
      text: result.data.text,
      confidence: result.data.confidence / 100, // Convert to 0-1 range
      blocks: result.data.blocks ?? [],
      recognizedStructures,
      originalImageUrl: imageUrl
    };
    
    return ocrResult;
  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error('Failed to process the image with OCR');
  }
};

/**
 * Extract the first page of a PDF as an image for OCR processing
 */
export const extractImageFromPDF = async (pdfFile: File): Promise<HTMLCanvasElement> => {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    // Get the first page
    const page = await pdf.getPage(1);
    
    // Render the page to a canvas
    const viewport = page.getViewport({ scale: 1.5 }); // Scale up for better OCR
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({
      canvasContext: context!,
      viewport: viewport
    }).promise;
    
    return canvas;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract image from PDF');
  }
};

/**
 * Process a PDF file with OCR
 */
export const processPDFWithOCR = async (pdfFile: File): Promise<OCRResult> => {
  try {
    // Extract the first page as an image
    const canvas = await extractImageFromPDF(pdfFile);
    
    // Process with Tesseract
    const result = await Tesseract.recognize(
      canvas,
      'eng', // language
      {
        logger: m => console.log(m)
      }
    );
    
    // Extract structured information
    const recognizedStructures = extractStructuredInfoFromOCR(result.data.text);
    
    // Create a blob URL from the canvas
    const imageUrl = canvas.toDataURL('image/png');
    
    // Create the result object
    const ocrResult: OCRResult = {
      text: result.data.text,
      confidence: result.data.confidence / 100,
      blocks: result.data.blocks ?? [],
      recognizedStructures,
      originalImageUrl: imageUrl
    };
    
    return ocrResult;
  } catch (error) {
    console.error('PDF OCR processing error:', error);
    throw new Error('Failed to process the PDF with OCR');
  }
};

/**
 * Extract structured information from OCR text
 */
const extractStructuredInfoFromOCR = (text: string): OCRResult['recognizedStructures'] => {
  const structures: OCRResult['recognizedStructures'] = {};
  
  // Date patterns (various formats)
  const datePatterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i, // DD/MM/YYYY or MM/DD/YYYY
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/i,    // YYYY/MM/DD
    /(\w{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?,\s+(\d{4})/i // Month Day, Year
  ];
  
  // Time patterns
  const timePattern = /(\d{1,2}):(\d{2})(?:\s*([AP]M))?/i;
  
  // Event name patterns (typically all caps or followed by specific keywords)
  const eventNamePatterns = [
    /EVENT[:\s]+([^\n]+)/i,
    /CONCERT[:\s]+([^\n]+)/i,
    /SHOW[:\s]+([^\n]+)/i,
    /PERFORMANCE[:\s]+([^\n]+)/i
  ];
  
  // Ticket ID patterns
  const ticketIdPatterns = [
    /TICKET\s*(?:#|ID|NUMBER)[:\s]*([A-Z0-9\-]+)/i,
    /ORDER\s*(?:#|ID|NUMBER)[:\s]*([A-Z0-9\-]+)/i,
    /CONFIRMATION[:\s]*([A-Z0-9\-]+)/i
  ];
  
  // Seat information patterns
  const seatPatterns = [
    /SEAT[:\s]+([^\n]+)/i,
    /ROW[:\s]+([A-Z0-9]+)[^\n]*SEAT[:\s]+(\d+)/i,
    /SECTION[:\s]+([A-Z0-9]+)[^\n]*/i
  ];
  
  // Price patterns
  const pricePatterns = [
    /\$\s*(\d+\.\d{2})/,
    /PRICE[:\s]*\$?\s*(\d+\.\d{2})/i,
    /TOTAL[:\s]*\$?\s*(\d+\.\d{2})/i
  ];
  
  // Barcode patterns
  const barcodePatterns = [
    /BARCODE[:\s]*([A-Z0-9]+)/i,
    /(?<!BAR)CODE[:\s]*([A-Z0-9]+)/i
  ];
  
  // Venue patterns
  const venuePatterns = [
    /VENUE[:\s]+([^\n]+)/i,
    /LOCATION[:\s]+([^\n]+)/i,
    /ARENA[:\s]+([^\n]+)/i,
    /STADIUM[:\s]+([^\n]+)/i,
    /THEATER[:\s]+([^\n]+)/i,
    /THEATRE[:\s]+([^\n]+)/i
  ];
  
  // Try to match event name
  for (const pattern of eventNamePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      structures.eventName = match[1].trim();
      break;
    }
  }
  
  // If no structured event name found, try to find the most prominent text
  // (Often the event name is in large text at the top)
  if (!structures.eventName) {
    const lines = text.split('\n');
    if (lines.length > 0) {
      // Assume one of the first few non-empty lines might be the event name
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        const line = lines[i].trim();
        if (line && line.length > 5 && !/ticket|order|confirmation|date|time/i.test(line)) {
          structures.eventName = line;
          break;
        }
      }
    }
  }
  
  // Try to match date and time for event date
  let dateStr = '';
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      dateStr = match[0];
      break;
    }
  }
  
  let timeStr = '';
  const timeMatch = text.match(timePattern);
  if (timeMatch) {
    timeStr = timeMatch[0];
  }
  
  if (dateStr) {
    structures.eventDate = timeStr ? `${dateStr} ${timeStr}` : dateStr;
  }
  
  // Try to match ticket ID
  for (const pattern of ticketIdPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      structures.ticketId = match[1].trim();
      break;
    }
  }
  
  // Try to match seat information
  let seatInfo = '';
  for (const pattern of seatPatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) { // Row and seat pattern
        seatInfo = `Row ${match[1]}, Seat ${match[2]}`;
      } else if (match[1]) { // General seat pattern
        seatInfo = match[1].trim();
      }
      break;
    }
  }
  
  if (seatInfo) {
    structures.seatInfo = seatInfo;
  }
  
  // Try to match price
  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      structures.price = `$${match[1]}`;
      break;
    }
  }
  
  // Try to match barcode
  for (const pattern of barcodePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      structures.barcode = match[1].trim();
      break;
    }
  }
  
  // Try to match venue
  for (const pattern of venuePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      structures.venueInfo = match[1].trim();
      break;
    }
  }
  
  return structures;
};

/**
 * Scan for QR codes in an image
 */
export const scanQRCodeFromImage = async (
  imageFile: File
): Promise<{ text: string; location: any } | null> => {
  try {
    // Create an image element and wait for it to load
    const imageElement = document.createElement('img');
    await new Promise((resolve, reject) => {
      imageElement.onload = resolve;
      imageElement.onerror = reject;
      imageElement.src = URL.createObjectURL(imageFile);
    });
    
    // Create a canvas to draw the image
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    context!.drawImage(imageElement, 0, 0);
    
    // Get the image data
    const imageData = context!.getImageData(0, 0, canvas.width, canvas.height);
    
    // Scan for QR code
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
      return {
        text: code.data,
        location: code.location
      };
    }
    
    return null;
  } catch (error) {
    console.error('QR code scanning error:', error);
    throw new Error('Failed to scan for QR code');
  }
};

/**
 * Auto-detect and process a file with OCR or QR code scanning
 */
export const processTicketFile = async (file: File): Promise<any> => {
  try {
    // Detect file type
    const fileBuffer = await file.arrayBuffer();
    // Use Uint8Array instead of Buffer for browser compatibility
    const arrayBuffer = new Uint8Array(fileBuffer);
    const type = await fileType.fileTypeFromBuffer(arrayBuffer);
    
    // If it's a PDF, process with PDF OCR
    if (type?.mime === 'application/pdf' || file.type === 'application/pdf') {
      return await processPDFWithOCR(file);
    }
    
    // If it's an image, try QR code first, then fall back to OCR
    if (type?.mime.startsWith('image/') || file.type.startsWith('image/')) {
      // Try to scan for QR code
      const qrResult = await scanQRCodeFromImage(file);
      
      if (qrResult && qrResult.text) {
        return {
          type: 'qrcode',
          data: qrResult.text,
          confidence: 1.0 // QR codes are reliable when detected
        };
      }
      
      // If no QR code found, process with OCR
      return {
        type: 'ocr',
        ...(await processImageWithOCR(file))
      };
    }
    
    // Unsupported file type
    throw new Error('Unsupported file type for ticket processing');
  } catch (error) {
    console.error('Ticket file processing error:', error);
    throw error;
  }
};
