import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Square, RotateCcw, Volume2, FileText } from 'lucide-react';

const AudioDiagnostic = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [status, setStatus] = useState('Ready to test microphone');
  const [volume, setVolume] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check support
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setIsSupported(true);
      setStatus('✅ Microphone access supported');
    } else {
      setStatus('❌ Microphone access not supported in this browser');
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setStatus('🎤 Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      streamRef.current = stream;
      
      // Set up audio analysis for volume visualization
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyzer = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyzer.smoothingTimeConstant = 0.8;
      analyzer.fftSize = 1024;
      
      microphone.connect(analyzer);
      analyzerRef.current = analyzer;
      
      // Start volume monitoring
      const monitorVolume = () => {
        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        analyzer.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setVolume(Math.round(average));
        
        if (isRecording) {
          animationRef.current = requestAnimationFrame(monitorVolume);
        }
      };
      
      monitorVolume();
      
      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        
        // Create URL for playback
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        setStatus(`📼 Recording saved (${Math.round(blob.size / 1024)}KB) - Click Play to test`);
        
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        audioContext.close();
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      
      setIsRecording(true);
      setRecordingTime(0);
      setStatus('🎤 Recording... Speak now!');
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to access microphone:', error);
      setStatus(`❌ Microphone access failed: ${error.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      setVolume(0);
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      setStatus('🔊 Playing back your recording...');
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setStatus('⏸️ Playback paused');
    }
  };

  const transcribeAudio = async () => {
    if (!audioUrl) return;
    
    setIsTranscribing(true);
    setTranscriptionError('');
    setStatus('🔄 Starting live transcription test...');
    
    try {
      // Check support
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error('Speech Recognition not supported');
      }
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Configure recognition - use same settings as the problematic components
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      let finalTranscript = '';
      let timeoutId = null;
      
      // Setup recognition handlers
      recognition.onstart = () => {
        console.log('🎤 Live transcription started');
        setStatus('🎤 Live transcription active - Please speak now...');
        
        // Auto-stop after 10 seconds
        timeoutId = setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
            if (!finalTranscript) {
              setTranscriptionError('No speech detected in 10 seconds');
              setStatus('❌ No speech detected - try speaking louder or closer to mic');
            }
          }
        }, 10000);
      };
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        
        // Process all results
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            console.log('📝 Final transcription:', transcript);
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update display with interim results
        const currentText = finalTranscript + interimTranscript;
        if (currentText.trim()) {
          setTranscript(currentText.trim());
          setStatus(`🎤 Transcribing: "${currentText.trim()}"`);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('❌ Live transcription error:', event.error);
        
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        let errorMsg = '';
        switch (event.error) {
          case 'no-speech':
            errorMsg = 'No speech detected - make sure to speak clearly into the microphone';
            break;
          case 'not-allowed':
            errorMsg = 'Microphone permission denied - check browser permissions';
            break;
          case 'aborted':
            errorMsg = 'Recognition was aborted - this is the same error from other components';
            break;
          case 'network':
            errorMsg = 'Network error - check internet connection';
            break;
          default:
            errorMsg = `${event.error} - this matches the error from other speech components`;
        }
        
        setTranscriptionError(errorMsg);
        setStatus(`❌ Live transcription failed: ${event.error}`);
        setIsTranscribing(false);
      };
      
      recognition.onend = () => {
        console.log('⏹️ Live transcription ended');
        
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        setIsTranscribing(false);
        
        if (finalTranscript.trim()) {
          setTranscript(finalTranscript.trim());
          setStatus(`✅ Live transcription complete: "${finalTranscript.trim()}"`);
        } else if (!transcriptionError) {
          setStatus('❌ No speech was detected during live transcription');
        }
      };
      
      recognitionRef.current = recognition;
      
      // Start live recognition (same as the other components)
      recognition.start();
      
    } catch (error) {
      console.error('Failed to start live transcription:', error);
      setTranscriptionError(error.message);
      setStatus(`❌ Live transcription setup failed: ${error.message}`);
      setIsTranscribing(false);
    }
  };

  const resetTest = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
    setVolume(0);
    setTranscript('');
    setIsTranscribing(false);
    setTranscriptionError('');
    setStatus('🔄 Reset - Ready to test again');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="glass-morphism p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">❌ Not Supported</h1>
          <p>Your browser doesn't support microphone access.</p>
          <p className="mt-2 text-sm text-gray-400">Please use Chrome, Edge, or Safari.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      {/* Header */}
      <div className="glass-morphism p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording 
                ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse shadow-lg shadow-red-500/25' 
                : isPlaying
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 animate-pulse shadow-lg shadow-blue-500/25'
                : 'bg-gray-600'
            }`}>
              {isRecording ? (
                <Mic className="w-8 h-8 text-white" />
              ) : isPlaying ? (
                <Volume2 className="w-8 h-8 text-white" />
              ) : (
                <MicOff className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Audio Diagnostic Tool
              </h1>
              <p className="text-gray-400">{status}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={startRecording}
              disabled={isRecording || !isSupported}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              <Mic className="w-5 h-5" />
              {isRecording ? 'Recording...' : 'Record'}
            </button>
            
            <button
              onClick={stopRecording}
              disabled={!isRecording}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              <Square className="w-5 h-5" />
              Stop
            </button>
            
            <button
              onClick={isPlaying ? pauseAudio : playAudio}
              disabled={!audioUrl}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            
            <button
              onClick={transcribeAudio}
              disabled={!audioUrl || isTranscribing}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              {isTranscribing ? 'Listening...' : 'Live Test'}
            </button>
            
            <button
              onClick={resetTest}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="glass-morphism p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-red-400 text-xl font-bold">🔴 RECORDING</div>
              <div className="text-lg">{formatTime(recordingTime)}</div>
            </div>
            
            {/* Volume Meter */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">Volume:</span>
              <div className="w-32 h-4 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-100"
                  style={{ width: `${Math.min(volume * 2, 100)}%` }}
                />
              </div>
              <span className="text-sm text-white w-8">{volume}</span>
            </div>
          </div>
        </div>
      )}

      {/* Audio Playback */}
      {audioUrl && (
        <div className="glass-morphism p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">🎵 Audio Playback</h2>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <audio 
              ref={audioRef}
              src={audioUrl}
              onEnded={() => {
                setIsPlaying(false);
                setStatus('✅ Playback completed - Did you hear your voice clearly?');
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              controls
              className="w-full"
            />
            
            <div className="mt-4 text-sm text-gray-400 flex justify-between">
              <span>File size: {audioBlob ? Math.round(audioBlob.size / 1024) : 0} KB</span>
              <span>Duration: {formatTime(recordingTime)}</span>
              <span>Quality: {audioBlob?.type || 'Unknown'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Speech Recognition Transcription */}
      {audioUrl && (
        <div className="glass-morphism p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">📝 Live Speech Recognition Test</h2>
          <div className="bg-gray-900/50 rounded-lg p-4">
            {transcript ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-600/20 border border-green-500/30 rounded-lg">
                  <h3 className="text-green-300 font-semibold mb-2">✅ Transcription Result:</h3>
                  <p className="text-white text-lg leading-relaxed">"{transcript}"</p>
                </div>
                
                <div className="text-sm text-gray-400 flex justify-between">
                  <span>Words detected: {transcript.split(' ').length}</span>
                  <span>Characters: {transcript.length}</span>
                  <span>Status: ✅ Success</span>
                </div>
              </div>
            ) : transcriptionError ? (
              <div className="p-4 bg-red-600/20 border border-red-500/30 rounded-lg">
                <h3 className="text-red-300 font-semibold mb-2">❌ Transcription Error:</h3>
                <p className="text-white">{transcriptionError}</p>
              </div>
            ) : isTranscribing ? (
              <div className="p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                <h3 className="text-blue-300 font-semibold mb-2">🔄 Transcribing...</h3>
                <p className="text-white">Speech recognition is analyzing your recording...</p>
              </div>
            ) : (
              <div className="text-center text-gray-400 p-8">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p>Click "Live Test" to test real-time speech recognition</p>
                <p className="text-sm mt-2">This tests the same speech-to-text system used in other components</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="glass-morphism p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">🔍 Microphone Diagnostic Instructions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-green-300 mb-3">✅ Complete Test Process:</h3>
            <ol className="space-y-2 text-gray-300 text-sm">
              <li>1. Click "Record" to start recording</li>
              <li>2. Speak clearly: "Hello, this is a microphone test"</li>
              <li>3. Watch the volume meter - should show green bars</li>
              <li>4. Click "Stop" after 5-10 seconds</li>
              <li>5. Click "Play" to hear your recording quality</li>
              <li>6. Click "Live Test" to test real-time speech recognition</li>
              <li>7. Compare what you said vs what was transcribed</li>
            </ol>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-blue-300 mb-3">🎯 What This Tests:</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Microphone hardware functionality</li>
              <li>• Browser microphone permissions</li>
              <li>• Audio capture quality and clarity</li>
              <li>• Audio playback capability</li>
              <li>• Speech recognition accuracy</li>
              <li>• Separates mic issues from speech-to-text issues</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-600/20 border border-yellow-500/30 rounded-lg">
          <h4 className="font-semibold text-yellow-300 mb-2">🧪 Diagnostic Results:</h4>
          <div className="text-sm text-gray-300 space-y-2">
            <p><strong>✅ If playback is clear + transcription works:</strong> Everything is working! Issue is in the main app.</p>
            <p><strong>🔊 If playback is clear + transcription fails:</strong> Microphone works, but speech recognition has issues.</p>
            <p><strong>🎤 If playback is unclear/silent:</strong> Microphone hardware or permission issue.</p>
            <p><strong>❌ If no recording creates:</strong> Browser doesn't have microphone access permission.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioDiagnostic;