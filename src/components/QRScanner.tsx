import React, { useState, useRef, useEffect } from 'react';
import { Camera, X } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onCodeDetected: (code: string) => void;
  onClose?: () => void;
  title?: string;
  description?: string;
}

const QRScanner: React.FC<QRScannerProps> = ({
  onCodeDetected,
  onClose,
  title = 'Scan QR Code',
  description = 'Position the QR code within the frame to scan.'
}) => {
  const [scanning, setScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Start the camera and QR code scanning
  const startScanning = async () => {
    try {
      setScanning(true);
      setError(null);
      
      // Get user media - prefer environment facing camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      // Set the video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start the scan loop
        scanCode();
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
      setScanning(false);
    }
  };

  // Stop scanning and release camera
  const stopScanning = () => {
    setScanning(false);
    
    // Cancel the animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop all tracks on the stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Scan for QR code in the video frame
  const scanCode = () => {
    if (!videoRef.current || !canvasRef.current) {
      animationFrameRef.current = requestAnimationFrame(scanCode);
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      animationFrameRef.current = requestAnimationFrame(scanCode);
      return;
    }
    
    // Only process frames if video is playing
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get the image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Scan for QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });
      
      if (code) {
        // QR code detected
        console.log('QR code detected:', code.data);
        
        // Highlight the QR code
        context.beginPath();
        context.moveTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
        context.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
        context.lineTo(code.location.bottomRightCorner.x, code.location.bottomRightCorner.y);
        context.lineTo(code.location.bottomLeftCorner.x, code.location.bottomLeftCorner.y);
        context.closePath();
        context.lineWidth = 4;
        context.strokeStyle = '#FF3B58';
        context.stroke();
        
        // Stop scanning and notify parent
        stopScanning();
        onCodeDetected(code.data);
        return;
      }
    }
    
    // Continue scanning
    animationFrameRef.current = requestAnimationFrame(scanCode);
  };

  // Start scanning when component mounts
  useEffect(() => {
    startScanning();
    
    // Cleanup on unmount
    return () => {
      stopScanning();
    };
  }, []);

  // Handle close button
  const handleClose = () => {
    stopScanning();
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full overflow-hidden relative">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">{title}</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Scanner content */}
        <div className="p-4">
          <p className="text-gray-600 text-sm mb-4">{description}</p>
          
          {error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-700 text-sm mb-4">
              {error}
            </div>
          ) : null}
          
          {/* Video preview with scanning frame overlay */}
          <div className="relative aspect-square w-full bg-black overflow-hidden rounded-lg">
            {/* Actual video element */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              playsInline
            />
            
            {/* Canvas for processing (hidden) */}
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Scanning frame */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2/3 h-2/3 border-2 border-white border-opacity-50 rounded-lg">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br"></div>
              </div>
            </div>
            
            {/* Scanning animation */}
            {scanning && (
              <div className="absolute inset-x-0 top-1/3 h-1 bg-indigo-500 opacity-70 animate-scanline"></div>
            )}
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center justify-center mt-4">
            {scanning ? (
              <div className="flex items-center text-indigo-600">
                <div className="animate-pulse mr-2">
                  <Camera className="h-5 w-5" />
                </div>
                <span>Scanning...</span>
              </div>
            ) : (
              <div className="text-gray-600">Camera inactive</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
