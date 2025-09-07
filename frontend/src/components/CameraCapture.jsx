import { useState, useRef, useEffect } from 'react';
import { Camera, Scan, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

const CameraCapture = ({ onCapture, isDemo }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionState, setPermissionState] = useState('requesting');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setIsLoading(true);
    setCameraError(null);
    setPermissionState('requesting');

    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // Request camera permissions
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'user' // Prefer front camera
        } 
      });

      setStream(mediaStream);
      setPermissionState('granted');
      setCameraError(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setIsLoading(false);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setIsLoading(false);
      setStream(null);
      
      // Handle different types of camera errors
      if (error.name === 'NotAllowedError') {
        setPermissionState('denied');
        setCameraError({
          type: 'permission',
          message: 'Camera access denied. Please allow camera permissions and refresh the page.',
          action: 'Grant Permission'
        });
      } else if (error.name === 'NotFoundError') {
        setPermissionState('no-camera');
        setCameraError({
          type: 'no-camera',
          message: 'No camera found on this device.',
          action: null
        });
      } else if (error.name === 'NotSupportedError') {
        setPermissionState('not-supported');
        setCameraError({
          type: 'not-supported',
          message: 'Camera not supported in this browser.',
          action: null
        });
      } else {
        setPermissionState('error');
        setCameraError({
          type: 'generic',
          message: 'Unable to access camera. Please check your camera settings.',
          action: 'Retry'
        });
      }
    }
  };

  const handleRetryCamera = () => {
    startCamera();
  };


  const captureImage = async () => {
    if (isDemo) {
      // Demo mode - simulate capture
      setIsAnalyzing(true);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate analysis time
      
      const mockClothing = {
        type: 'suit',
        color: 'charcoal gray',
        style: 'business formal',
        material: 'wool blend',
        confidence: 0.95
      };
      setIsAnalyzing(false);
      onCapture(mockClothing);
      return;
    }

    if (!stream || !videoRef.current) {
      console.error('No video stream available');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d');
      
      // Draw the current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data as base64
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageData);
      
      // Send to Gemini for clothing analysis
      const analysisResult = await GeminiService.analyzeClothing(
        imageData,
        `Analyze this clothing image and identify:
        1. Type of clothing (suit, shirt, dress, pants, jacket, etc.)
        2. Primary color and any secondary colors
        3. Style category (formal, casual, business, evening, etc.)
        4. Material/fabric type if visible (cotton, wool, silk, denim, etc.)
        5. Pattern or texture (solid, striped, plaid, etc.)
        6. Fit and cut (tailored, loose, slim, etc.)
        7. Any notable design details or features
        
        Return as JSON:
        {
          "type": "clothing type",
          "color": "primary color",
          "secondary_colors": ["color1", "color2"],
          "style": "style category", 
          "material": "fabric type",
          "pattern": "pattern description",
          "fit": "fit description",
          "details": ["detail1", "detail2"],
          "confidence": 0.85
        }`
      );

      if (analysisResult.success) {
        onCapture(analysisResult.analysis);
      } else {
        // Fallback on API failure
        const fallbackClothing = {
          type: 'clothing item',
          color: 'detected from image',
          style: 'analyzed',
          material: 'fabric blend',
          confidence: 0.75,
          error: 'Analysis service temporarily unavailable'
        };
        onCapture(fallbackClothing);
      }
      
    } catch (error) {
      console.error('Clothing analysis failed:', error);
      
      // Fallback response on error
      const errorClothing = {
        type: 'clothing item',
        color: 'color analysis pending',
        style: 'style analysis pending', 
        material: 'material analysis pending',
        confidence: 0.5,
        error: 'Analysis failed, please try again'
      };
      onCapture(errorClothing);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="glass-morphism p-6">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-semibold">Smart Scan</h2>
      </div>
      
      <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-96 object-cover"
        />
        
        <canvas
          ref={canvasRef}
          width="640"
          height="480"
          className="hidden"
        />
        
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              <span className="text-white font-semibold">Analyzing clothing...</span>
            </div>
          </div>
        )}
        
        {(isLoading || !stream) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center">
              {isLoading && !cameraError && (
                <>
                  <RefreshCw className="w-12 h-12 text-purple-400 mx-auto mb-2 animate-spin" />
                  <p className="text-gray-400">
                    {permissionState === 'requesting' ? 'Requesting camera permission...' : 'Starting camera...'}
                  </p>
                </>
              )}
              
              {cameraError && (
                <>
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                  <p className="text-red-400 mb-4">{cameraError.message}</p>
                  
                  {cameraError.action === 'Retry' && (
                    <button
                      onClick={handleRetryCamera}
                      className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white font-semibold transition-colors flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry Camera
                    </button>
                  )}
                  
                  {cameraError.action === 'Grant Permission' && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">
                        Click the camera icon in your browser's address bar to grant permission
                      </p>
                      <button
                        onClick={handleRetryCamera}
                        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white font-semibold transition-colors flex items-center gap-2 mx-auto"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                      </button>
                    </div>
                  )}
                </>
              )}
              
              {!isLoading && !stream && !cameraError && (
                <>
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400">Camera not available</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="text-center text-sm text-gray-300">
          <p>Position clothing in the camera view and click to analyze</p>
        </div>
        
        <button
          onClick={captureImage}
          disabled={(!stream && !isDemo) || isAnalyzing}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Scan className="w-5 h-5" />
              {isDemo ? 'Start Demo Analysis' : (stream ? 'Capture & Analyze' : 'Camera Required')}
            </>
          )}
        </button>
        
        {isDemo && (
          <p className="text-yellow-400 text-sm text-center">
            Demo Mode: Will simulate AI clothing analysis with Gemini
          </p>
        )}
        
        {!isDemo && stream && (
          <p className="text-green-400 text-sm text-center">
            Ready to analyze clothing with Gemini AI
          </p>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;