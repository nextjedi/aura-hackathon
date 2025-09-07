import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, Eye, EyeOff, AlertCircle } from 'lucide-react';

const EmotionDetector = ({ onEmotionDetected, isActive = true, showUI = true }) => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentEmotions, setCurrentEmotions] = useState({});
  const [dominantEmotion, setDominantEmotion] = useState(null);
  const [faceCount, setFaceCount] = useState(0);
  const [status, setStatus] = useState('Initializing emotion detection...');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  
  const EMOTION_EMOJIS = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    fearful: '😨',
    disgusted: '🤢',
    surprised: '😮',
    neutral: '😐'
  };

  useEffect(() => {
    if (isActive) {
      loadModels();
    }

    return () => {
      cleanup();
    };
  }, [isActive]);

  const loadModels = async () => {
    try {
      setStatus('🔄 Loading face detection models...');
      
      // Load face-api.js models from CDN
      const modelUrl = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model/';
      
      // Check if face-api is loaded
      if (typeof window.faceapi === 'undefined') {
        // Load face-api.js script dynamically
        await loadFaceApiScript();
      }
      
      await window.faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
      await window.faceapi.nets.faceExpressionNet.loadFromUri(modelUrl);
      
      setIsModelLoaded(true);
      setStatus('✅ Models loaded! Ready for emotion detection.');
      console.log('✅ Face-api models loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading models:', error);
      setStatus(`❌ Failed to load models: ${error.message}`);
    }
  };

  const loadFaceApiScript = () => {
    return new Promise((resolve, reject) => {
      if (typeof window.faceapi !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/dist/face-api.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      
      streamRef.current = stream;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video && canvas) {
        video.srcObject = stream;
        
        video.addEventListener('loadedmetadata', () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          setIsCameraActive(true);
          setStatus('📹 Camera started! Click "Start Detection" to begin.');
        });
      }
      
    } catch (error) {
      console.error('❌ Camera error:', error);
      let errorMsg = '❌ Camera access failed: ';
      if (error.name === 'NotAllowedError') {
        errorMsg += 'Permission denied. Please allow camera access.';
      } else if (error.name === 'NotFoundError') {
        errorMsg += 'No camera found.';
      } else {
        errorMsg += error.message;
      }
      setStatus(errorMsg);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    
    setIsCameraActive(false);
    setIsDetecting(false);
    setCurrentEmotions({});
    setDominantEmotion(null);
    setFaceCount(0);
    setStatus('Camera stopped. Click "Start Camera" to restart.');
    
    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const toggleDetection = () => {
    if (!isModelLoaded) {
      setStatus('⚠️ Models not loaded yet. Please wait...');
      return;
    }
    
    if (isDetecting) {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      setIsDetecting(false);
      setStatus('⏸️ Detection paused. Click "Start Detection" to resume.');
    } else {
      setIsDetecting(true);
      setStatus('🔍 Detecting emotions in real-time...');
      detectionIntervalRef.current = setInterval(detectEmotions, 100); // 10fps
    }
  };

  const detectEmotions = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.readyState !== 4 || !window.faceapi) return;
    
    try {
      const detections = await window.faceapi
        .detectAllFaces(video, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();
      
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const faceCount = detections.length;
      setFaceCount(faceCount);
      
      if (detections.length > 0) {
        const detection = detections[0]; // Use first detected face
        const expressions = detection.expressions;
        
        // Draw face bounding box
        const box = detection.detection.box;
        ctx.strokeStyle = '#10b981'; // Green color
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        // Update emotions
        setCurrentEmotions(expressions);
        
        // Find dominant emotion
        let maxEmotion = '';
        let maxValue = 0;
        for (const [emotion, value] of Object.entries(expressions)) {
          if (value > maxValue) {
            maxValue = value;
            maxEmotion = emotion;
          }
        }
        
        const dominantEmotionData = {
          emotion: maxEmotion,
          confidence: maxValue,
          timestamp: Date.now()
        };
        
        setDominantEmotion(dominantEmotionData);
        
        // Call callback if provided
        if (onEmotionDetected) {
          onEmotionDetected(dominantEmotionData, expressions);
        }
        
      } else {
        setCurrentEmotions({});
        setDominantEmotion(null);
      }
      
    } catch (error) {
      console.error('Detection error:', error);
    }
  };

  const cleanup = () => {
    stopCamera();
  };

  if (!isActive) return null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Camera View */}
      <div className="relative bg-gray-900/50 rounded-lg overflow-hidden mb-4">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-auto max-w-full"
          style={{ maxHeight: '480px' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 pointer-events-none"
        />
        
        {/* Overlay Info */}
        {isDetecting && dominantEmotion && (
          <div className="absolute top-4 left-4 bg-black/70 rounded-lg p-3 text-white">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{EMOTION_EMOJIS[dominantEmotion.emotion]}</span>
              <div>
                <div className="font-semibold capitalize">{dominantEmotion.emotion}</div>
                <div className="text-sm opacity-80">
                  {(dominantEmotion.confidence * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Face Count */}
        {isDetecting && (
          <div className="absolute top-4 right-4 bg-black/70 rounded-lg p-2 text-white text-sm">
            👤 {faceCount} face{faceCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {showUI && (
        <>
          {/* Controls */}
          <div className="flex justify-center gap-3 mb-4">
            <button
              onClick={startCamera}
              disabled={isCameraActive || !isModelLoaded}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <Camera className="w-4 h-4" />
              Start Camera
            </button>
            
            <button
              onClick={stopCamera}
              disabled={!isCameraActive}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <CameraOff className="w-4 h-4" />
              Stop Camera
            </button>
            
            <button
              onClick={toggleDetection}
              disabled={!isCameraActive || !isModelLoaded}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              {isDetecting ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isDetecting ? 'Stop Detection' : 'Start Detection'}
            </button>
          </div>

          {/* Status */}
          <div className="bg-gray-800/50 rounded-lg p-3 mb-4 text-center">
            <div className="flex items-center justify-center gap-2">
              {!isModelLoaded && <AlertCircle className="w-4 h-4 text-yellow-400" />}
              <span className="text-sm">{status}</span>
            </div>
          </div>

          {/* Emotion Bars */}
          {Object.keys(currentEmotions).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(EMOTION_EMOJIS).map(([emotion, emoji]) => {
                const value = currentEmotions[emotion] || 0;
                const percentage = Math.round(value * 100);
                const isDominant = dominantEmotion?.emotion === emotion && value > 0.1;
                
                return (
                  <div
                    key={emotion}
                    className={`bg-gray-800/50 rounded-lg p-3 transition-all duration-300 ${
                      isDominant ? 'ring-2 ring-yellow-400 bg-yellow-400/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{emoji}</span>
                      <span className="text-sm font-semibold capitalize">{emotion}</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1 text-center">
                      {percentage}%
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmotionDetector;