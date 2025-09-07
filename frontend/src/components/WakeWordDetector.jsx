import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

const WakeWordDetector = ({ onWakeWord, isActive = true, onSpeechRecognized }) => {
  const [isListening, setIsListening] = useState(false);
  const [isWakeWordMode, setIsWakeWordMode] = useState(true);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    // Check for Web Speech API support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      console.log('Wake word detection started');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase();
        const confidence = event.results[i][0].confidence;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = (finalTranscript || interimTranscript).trim();
      setCurrentTranscript(fullTranscript);
      
      if (isWakeWordMode) {
        // Check for wake word: "hello"
        const wakeWords = ['hello'];
        const hasWakeWord = wakeWords.some(word => 
          fullTranscript.includes(word) || fullTranscript.endsWith(word.split(' ').pop())
        );
        
        if (hasWakeWord && finalTranscript) {
          console.log('Wake word detected:', fullTranscript);
          setIsWakeWordMode(false);
          onWakeWord?.(fullTranscript);
          
          // Continue listening for the actual command
          setCurrentTranscript('');
          
          // Set timeout to return to wake word mode if no speech
          timeoutRef.current = setTimeout(() => {
            setIsWakeWordMode(true);
          }, 10000); // 10 seconds timeout
        }
      } else {
        // In conversation mode, pass all speech to parent
        if (finalTranscript) {
          onSpeechRecognized?.(finalTranscript);
          setCurrentTranscript('');
          
          // Clear timeout and continue listening
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
              setIsWakeWordMode(true);
            }, 10000);
          }
        }
      }
      
      // Update confidence for animation
      if (event.results[event.results.length - 1]) {
        setConfidence(event.results[event.results.length - 1][0].confidence || 0);
      }
    };

    recognition.onerror = (event) => {
      console.error('Wake word detection error:', event.error);
      
      // Handle errors gracefully without breaking the flow
      switch (event.error) {
        case 'not-allowed':
          alert('Microphone access is required for voice interaction. Please enable microphone permissions.');
          setIsListening(false);
          break;
        case 'aborted':
          console.log('Speech recognition was aborted, will restart...');
          // Don't set listening to false for aborted - let onend handle restart
          break;
        case 'no-speech':
          console.log('No speech detected, continuing...');
          // Don't break the flow for no-speech
          break;
        default:
          console.log(`Speech error ${event.error}, will continue...`);
          setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (isActive) {
        // Restart recognition automatically
        setTimeout(() => {
          try {
            recognition.start();
          } catch (err) {
            console.log('Recognition restart failed:', err);
          }
        }, 1000);
      }
    };

    recognitionRef.current = recognition;

    // Start initial recognition
    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [isActive, isWakeWordMode, onWakeWord, onSpeechRecognized]);

  // Reset to wake word mode when component becomes active
  useEffect(() => {
    if (isActive) {
      setIsWakeWordMode(true);
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
      <div className="glass-morphism p-6 max-w-sm mx-auto">
        {/* Listening Animation */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            {/* Pulsing circles for listening effect */}
            <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
              isListening ? 'animate-ping bg-purple-400/30' : ''
            }`} style={{
              animationDuration: '2s',
              transform: `scale(${1 + (confidence * 0.5)})`,
            }} />
            
            <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
              isListening ? 'animate-pulse bg-pink-400/20' : ''
            }`} style={{
              animationDuration: '1.5s',
              transform: `scale(${1 + (confidence * 0.3)})`,
            }} />
            
            {/* Microphone icon */}
            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening 
                ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25' 
                : 'bg-gray-600'
            }`}>
              {isListening ? (
                <Mic className="w-8 h-8 text-white" />
              ) : (
                <MicOff className="w-8 h-8 text-gray-400" />
              )}
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-white">
              {isWakeWordMode ? 'Say "Hello"' : 'Listening...'}
            </h3>
            
            {currentTranscript && (
              <p className="text-sm text-gray-300 italic">
                "{currentTranscript}"
              </p>
            )}
            
            <div className="text-xs text-gray-400">
              {isListening ? (
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  {isWakeWordMode ? 'Ready for wake word' : 'Recording your message'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  Microphone off
                </span>
              )}
            </div>
          </div>

          {/* Voice Level Indicator */}
          {isListening && (
            <div className="w-full max-w-32">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-150 rounded-full"
                  style={{ width: `${Math.min(confidence * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Wake word help */}
        {isWakeWordMode && (
          <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <p className="text-xs text-purple-300 text-center">
              Try: "Hello" to activate Mandy
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WakeWordDetector;