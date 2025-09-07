import { useState, useEffect, useRef } from 'react';
import { Mic, Volume2 } from 'lucide-react';

const TestingInterface = () => {
  const [isListening, setIsListening] = useState(false);
  const [allTranscripts, setAllTranscripts] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [mandyActivated, setMandyActivated] = useState(false);
  const [mandyResponses, setMandyResponses] = useState([]);
  const recognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null);

  // Mandy's conversation responses based on demo script
  const getResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes('confused') || input.includes('date night') || input.includes("don't know what to wear")) {
      return "Oh don't worry darling! Show me your closet and let me help you impress your girlfriend!";
    }
    
    if (input.includes('wife') || input.includes('darling wife') || input.includes('not girlfriend')) {
      return "Oh lovely! A date with your darling wife - even better! Where are you two planning to go?";
    }
    
    if (input.includes('taj patna') || input.includes('taj')) {
      return "Taj Patna! Such a romantic and elegant choice! This calls for something really special. Let me check what treasures you have in your closet.";
    }
    
    if (input.includes('this one') && input.includes('hair')) {
      return "Oho! Someone's getting excited! Let's explore this fashion journey together!";
    }
    
    if (input.includes('titan') || input.includes('watch')) {
      return "Excellent choice! The Titan Grandmaster will add such sophistication. And bigger hair? Absolutely! Let me update your look with that bold styling.";
    }
    
    if (input.includes('priyanka chopra') || input.includes('wife looks like')) {
      return "What a beautiful compliment to your wife! Let me create some stunning couple photos of you both at Taj Patna. She'll look absolutely radiant in red!";
    }
    
    if (input.includes('showing off')) {
      return "Guilty as charged! But that's what I'm here for - to make you look absolutely irresistible. Your wife is going to be so impressed!";
    }
    
    return "I'm listening! Tell me more about your styling needs.";
  };

  useEffect(() => {
    initializeSpeechRecognition();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);

  const initializeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      addTranscript('system', '❌ Speech recognition not supported in this browser');
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
      addTranscript('system', '🎤 Listening started... Say "Mandy" to activate!');
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

      // Update current transcript for live display
      setCurrentTranscript(interimTranscript);

      if (finalTranscript) {
        // Add to transcript history
        addTranscript('user', finalTranscript);
        
        // Check for wake word
        const lowerTranscript = finalTranscript.toLowerCase();
        if (lowerTranscript.includes('mandy') || lowerTranscript.includes('hey mandy')) {
          if (!mandyActivated) {
            setMandyActivated(true);
            addMandyResponse("Hello gorgeous! I'm Mandy, your AI styling assistant. I heard you need help with something special - what's the occasion?");
          } else {
            // Mandy is activated, respond to the input
            const response = getResponse(finalTranscript);
            addMandyResponse(response);
          }
        } else if (mandyActivated) {
          // Mandy is already activated, respond to any input
          const response = getResponse(finalTranscript);
          addMandyResponse(response);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      addTranscript('system', `❌ Error: ${event.error}`);
      setIsListening(false);
      
      // Auto-restart on error (except permission denied)
      if (event.error !== 'not-allowed') {
        restartRecognition();
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      addTranscript('system', '🔄 Recognition ended, restarting...');
      restartRecognition();
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
        addTranscript('system', `❌ Failed to start: ${error.message}`);
      }
    }
  };

  const restartRecognition = () => {
    restartTimeoutRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        startListening();
      }
    }, 1000);
  };

  const addTranscript = (type, text) => {
    const entry = {
      id: Date.now() + Math.random(),
      type, // 'user', 'system', 'mandy'
      text,
      timestamp: new Date().toLocaleTimeString()
    };
    setAllTranscripts(prev => [...prev, entry]);
  };

  const addMandyResponse = (response) => {
    const mandyEntry = {
      id: Date.now(),
      type: 'mandy',
      text: response,
      timestamp: new Date().toLocaleTimeString()
    };
    setAllTranscripts(prev => [...prev, mandyEntry]);
    setMandyResponses(prev => [...prev, mandyEntry]);
  };

  const clearTranscripts = () => {
    setAllTranscripts([]);
    setMandyResponses([]);
    setMandyActivated(false);
    setCurrentTranscript('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      {/* Header */}
      <div className="glass-morphism p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening 
                ? 'bg-gradient-to-br from-green-500 to-emerald-500 animate-pulse' 
                : 'bg-gray-600'
            }`}>
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AURA Testing Mode</h1>
              <p className="text-gray-400">
                {isListening ? '🎤 Continuous listening active' : '🔴 Microphone off'}
                {mandyActivated && ' | 💬 Mandy activated'}
              </p>
            </div>
          </div>
          
          <button
            onClick={clearTranscripts}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Current Live Transcript */}
        {currentTranscript && (
          <div className="mt-4 p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-sm font-semibold mb-1">🎤 Currently hearing:</p>
            <p className="text-white italic">"{currentTranscript}"</p>
          </div>
        )}
      </div>

      {/* Transcript History */}
      <div className="glass-morphism p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Live Transcript Feed
        </h2>
        
        <div className="bg-gray-900/50 rounded-lg p-4 h-96 overflow-y-auto">
          {allTranscripts.length === 0 ? (
            <div className="text-center text-gray-400 mt-8">
              <p>🎤 Waiting for speech...</p>
              <p className="text-sm mt-2">Say "Mandy" to activate the AI assistant!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allTranscripts.map((entry) => (
                <div
                  key={entry.id}
                  className={`p-3 rounded-lg ${
                    entry.type === 'user' 
                      ? 'bg-blue-600/20 border-l-4 border-blue-500' 
                      : entry.type === 'mandy'
                      ? 'bg-purple-600/20 border-l-4 border-purple-500'
                      : 'bg-gray-600/20 border-l-4 border-gray-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${
                        entry.type === 'user' ? 'text-blue-300' :
                        entry.type === 'mandy' ? 'text-purple-300' : 'text-gray-300'
                      }`}>
                        {entry.type === 'user' ? '👤 You said:' :
                         entry.type === 'mandy' ? '🤖 Mandy:' : '🔧 System:'}
                      </p>
                      <p className="text-white mt-1">{entry.text}</p>
                    </div>
                    <span className="text-xs text-gray-400 ml-4">{entry.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="glass-morphism p-6 mt-6">
        <h3 className="text-lg font-semibold mb-3">Testing Instructions:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-purple-300 mb-2">Wake Word Activation:</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• Say "Mandy" or "Hey Mandy"</li>
              <li>• Watch for purple Mandy responses</li>
              <li>• Microphone stays on continuously</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blue-300 mb-2">Demo Script Test:</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• "I'm confused what to wear for date night"</li>
              <li>• "Not girlfriend, my darling wife"</li>
              <li>• "Taj Patna"</li>
              <li>• "This one might work, what hairstyle?"</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-green-300 mb-2">Additional Features:</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• Real-time transcript logging</li>
              <li>• Emotion detection ready</li>
              <li>• Context extraction active</li>
              <li>• Demo mode compatible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestingInterface;