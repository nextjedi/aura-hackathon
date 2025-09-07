import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

const SimpleSpeechDisplay = () => {
  const [isListening, setIsListening] = useState(false);
  const [currentSpeech, setCurrentSpeech] = useState('');
  const [allSpeech, setAllSpeech] = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    initializeSpeechRecognition();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const initializeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      addSpeechEntry('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      addSpeechEntry('🎤 Listening started...');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Show interim results in real-time
      setCurrentSpeech(interimTranscript);

      // Add final results to speech log
      if (finalTranscript.trim()) {
        addSpeechEntry(finalTranscript.trim());
        setCurrentSpeech(''); // Clear interim after final
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      addSpeechEntry(`❌ Error: ${event.error}`);
      setIsListening(false);
      
      // Auto-restart on most errors
      if (event.error !== 'not-allowed') {
        setTimeout(() => {
          startListening();
        }, 1000);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      addSpeechEntry('🔄 Restarting...');
      
      // Auto-restart
      setTimeout(() => {
        startListening();
      }, 1000);
    };

    recognitionRef.current = recognition;
    startListening();
  };

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  };

  const addSpeechEntry = (text) => {
    const entry = {
      id: Date.now() + Math.random(),
      text,
      timestamp: new Date().toLocaleTimeString()
    };
    setAllSpeech(prev => [...prev, entry]);
  };

  const clearAll = () => {
    setAllSpeech([]);
    setCurrentSpeech('');
  };

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
              <Mic className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Speech Display
              </h1>
              <p className="text-gray-400">
                {isListening ? '🎤 Continuous listening active' : '🔴 Microphone off'}
              </p>
            </div>
          </div>
          
          <button
            onClick={clearAll}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition-colors font-semibold"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Current Speech (Live) */}
      {currentSpeech && (
        <div className="glass-morphism p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3 text-blue-300">🎤 Currently Speaking:</h2>
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-white text-lg italic">"{currentSpeech}"</p>
          </div>
        </div>
      )}

      {/* Speech History */}
      <div className="glass-morphism p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Speech Log</h2>
        
        <div className="bg-gray-900/50 rounded-lg p-4 h-96 overflow-y-auto">
          {allSpeech.length === 0 ? (
            <div className="text-center text-gray-400 mt-8">
              <Mic className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-lg">Waiting for speech...</p>
              <p className="text-sm mt-2">Start talking and see your words appear here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allSpeech.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-gray-800/50 rounded-lg border-l-4 border-purple-500"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-white text-lg">{entry.text}</p>
                    </div>
                    <span className="text-xs text-gray-400 ml-4 whitespace-nowrap">
                      {entry.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleSpeechDisplay;