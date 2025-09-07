import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, RotateCcw } from 'lucide-react';

const RawSpeechCapture = () => {
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [allText, setAllText] = useState('');
  const [status, setStatus] = useState('Ready');
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const lastResultRef = useRef('');

  useEffect(() => {
    // Check support and initialize
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      initializeRecognition();
    } else {
      setStatus('❌ Speech Recognition not supported. Use Chrome, Edge, or Safari.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);

  const initializeRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Optimal settings for continuous capture
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('🎤 Recognition started');
      setIsListening(true);
      setStatus('🎤 Listening continuously...');
    };

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';

      // Process all results
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          finalText += transcript + ' ';
        } else {
          interimText += transcript;
        }
      }

      // Update current transcript (what's being spoken now)
      setCurrentTranscript(interimText);

      // Add final text to accumulated text
      if (finalText.trim() && finalText.trim() !== lastResultRef.current) {
        console.log('📝 Adding final text:', finalText.trim());
        lastResultRef.current = finalText.trim();
        setAllText(prev => {
          const newText = prev ? prev + ' ' + finalText.trim() : finalText.trim();
          return newText;
        });
      }
    };

    recognition.onerror = (event) => {
      console.error('❌ Speech error:', event.error);
      
      switch (event.error) {
        case 'not-allowed':
          setStatus('❌ Microphone access denied. Please allow microphone access.');
          setIsListening(false);
          break;
        case 'no-speech':
          setStatus('🔄 No speech detected, continuing to listen...');
          // Don't stop on no-speech, just continue
          break;
        case 'aborted':
          setStatus('🔄 Restarting recognition...');
          restartRecognition();
          break;
        case 'network':
          setStatus('🌐 Network error, restarting...');
          restartRecognition();
          break;
        default:
          setStatus(`⚠️ Error: ${event.error}, restarting...`);
          restartRecognition();
      }
    };

    recognition.onend = () => {
      console.log('⏹️ Recognition ended');
      setIsListening(false);
      setCurrentTranscript('');
      
      // Auto-restart if we were supposed to be listening
      if (isListening) {
        console.log('🔄 Auto-restarting recognition...');
        restartRecognition();
      }
    };

    recognitionRef.current = recognition;
  };

  const restartRecognition = () => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }

    restartTimeoutRef.current = setTimeout(() => {
      if (recognitionRef.current && isListening) {
        try {
          recognitionRef.current.start();
          setStatus('🔄 Recognition restarted');
        } catch (error) {
          console.error('Failed to restart:', error);
          setStatus('❌ Failed to restart recognition');
        }
      }
    }, 1000);
  };

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;

    try {
      setStatus('🚀 Starting...');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start:', error);
      setStatus(`❌ Failed to start: ${error.message}`);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      setIsListening(false); // Set this first to prevent restart
      recognitionRef.current.stop();
      setStatus('⏹️ Stopped');
      setCurrentTranscript('');
    }
  };

  const clearAll = () => {
    setAllText('');
    setCurrentTranscript('');
    lastResultRef.current = '';
    if (!isListening) {
      setStatus('🗑️ Cleared - Ready to start');
    }
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="glass-morphism p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">❌ Not Supported</h1>
          <p>Please use Chrome, Edge, or Safari for speech recognition.</p>
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
              isListening 
                ? 'bg-gradient-to-br from-green-500 to-emerald-500 animate-pulse shadow-lg shadow-green-500/25' 
                : 'bg-gray-600'
            }`}>
              {isListening ? (
                <Mic className="w-8 h-8 text-white" />
              ) : (
                <MicOff className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Raw Speech Capture
              </h1>
              <p className="text-gray-400">{status}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={startListening}
              disabled={isListening}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              <Mic className="w-5 h-5" />
              {isListening ? 'Listening...' : 'Start'}
            </button>
            
            <button
              onClick={stopListening}
              disabled={!isListening}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-colors font-semibold"
            >
              Stop
            </button>
            
            <button
              onClick={clearAll}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Current Speaking */}
      {currentTranscript && (
        <div className="glass-morphism p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3 text-blue-300">🎤 Currently Speaking:</h2>
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-white text-lg">"{currentTranscript}"</p>
          </div>
        </div>
      )}

      {/* All Captured Text */}
      <div className="glass-morphism p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">📝 All Captured Text</h2>
          <div className="text-sm text-gray-400">
            {allText.split(' ').filter(w => w.length > 0).length} words • {allText.length} characters
          </div>
        </div>
        
        <div className="bg-gray-900/50 rounded-lg p-6 min-h-96">
          {allText ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-600/20 border border-green-500/30 rounded-lg">
                <p className="text-white text-lg leading-relaxed break-words">{allText}</p>
              </div>
              
              {/* Live stats */}
              <div className="flex justify-between text-sm text-gray-400">
                <span>Status: {isListening ? '🟢 Actively listening' : '🔴 Stopped'}</span>
                <span>Last update: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 mt-8">
              <Mic className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-lg">Click "Start" and begin speaking</p>
              <p className="text-sm mt-2">Every word will be captured and displayed here</p>
            </div>
          )}
        </div>
      </div>

      {/* Technical Details */}
      <div className="glass-morphism p-6 mt-6">
        <h3 className="text-lg font-semibold mb-3">⚙️ Technical Settings:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Continuous:</p>
            <p className="text-green-300 font-semibold">✅ TRUE</p>
          </div>
          <div>
            <p className="text-gray-400">Interim Results:</p>
            <p className="text-green-300 font-semibold">✅ TRUE</p>
          </div>
          <div>
            <p className="text-gray-400">Auto-restart:</p>
            <p className="text-green-300 font-semibold">✅ TRUE</p>
          </div>
          <div>
            <p className="text-gray-400">Language:</p>
            <p className="text-blue-300 font-semibold">en-US</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RawSpeechCapture;