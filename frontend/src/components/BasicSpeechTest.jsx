import { useState, useEffect, useRef } from 'react';

const BasicSpeechTest = () => {
  const [status, setStatus] = useState('Initializing...');
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check browser support
    const hasSupport = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
    setIsSupported(hasSupport);
    
    if (!hasSupport) {
      setStatus('❌ Speech Recognition not supported in this browser. Try Chrome, Edge, or Safari.');
      return;
    }

    // Initialize recognition object once - like working test script
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Configuration - exactly like working test
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // Event handlers - exactly like working test
    recognition.onstart = function() {
      console.log('Speech recognition started');
      setIsListening(true);
      setStatus('🎤 Listening... Speak now!');
    };

    recognition.onresult = function(event) {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript || interimTranscript) {
        const displayText = finalTranscript + (interimTranscript ? ` [${interimTranscript}]` : '');
        setTranscript(displayText);
      }
      
      console.log('Final transcript:', finalTranscript);
      console.log('Interim transcript:', interimTranscript);
    };

    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      let errorMessage = '❌ Error: ';
      switch (event.error) {
        case 'not-allowed':
          errorMessage += 'Microphone access denied. Please grant permission and reload.';
          break;
        case 'no-speech':
          errorMessage += 'No speech detected. Try speaking louder.';
          break;
        case 'audio-capture':
          errorMessage += 'No microphone found or audio capture failed.';
          break;
        case 'network':
          errorMessage += 'Network error occurred.';
          break;
        case 'aborted':
          errorMessage += 'Recognition was stopped. Click Start to try again.';
          break;
        default:
          errorMessage += event.error;
      }
      setStatus(errorMessage);
      setIsListening(false);
    };

    recognition.onend = function() {
      console.log('Speech recognition ended');
      setIsListening(false);
      setStatus('⏹️ Stopped listening. Click Start to begin again.');
    };

    // Store the initialized recognition
    recognitionRef.current = recognition;
    setStatus('✅ Speech Recognition ready. Click Start to begin.');

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = () => {
    if (!isSupported || isListening || !recognitionRef.current) return;

    // Clear error message - exactly like working test
    setStatus('Starting...');
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setStatus(`❌ Failed to start speech recognition: ${error.message}`);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)',
      color: 'white',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        padding: '2rem'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', textAlign: 'center' }}>
          🎤 Basic Speech Test
        </h1>

        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1rem'
        }}>
          <h3>Status:</h3>
          <p style={{ fontSize: '1.1rem', margin: '0.5rem 0' }}>{status}</p>
        </div>

        {isSupported && (
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <button
              onClick={startListening}
              disabled={isListening}
              style={{
                background: isListening ? '#6b7280' : '#10b981',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                borderRadius: '10px',
                cursor: isListening ? 'not-allowed' : 'pointer',
                opacity: isListening ? 0.6 : 1,
                marginRight: '1rem'
              }}
            >
              {isListening ? '🎤 Listening...' : '🎤 Start Listening'}
            </button>
            
            <button
              onClick={stopListening}
              disabled={!isListening}
              style={{
                background: !isListening ? '#6b7280' : '#ef4444',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                fontSize: '1.2rem',
                borderRadius: '10px',
                cursor: !isListening ? 'not-allowed' : 'pointer',
                opacity: !isListening ? 0.6 : 1
              }}
            >
              ⏹️ Stop
            </button>
          </div>
        )}

        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '2rem',
          borderRadius: '10px',
          minHeight: '200px'
        }}>
          <h3>What you said:</h3>
          {transcript ? (
            <p style={{ 
              fontSize: '1.2rem', 
              lineHeight: '1.6',
              margin: '1rem 0',
              background: 'rgba(59, 130, 246, 0.2)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              {transcript}
            </p>
          ) : (
            <p style={{ 
              color: '#9ca3af', 
              fontStyle: 'italic',
              textAlign: 'center',
              margin: '2rem 0'
            }}>
              Your speech will appear here...
            </p>
          )}
        </div>

        <div style={{
          marginTop: '2rem',
          background: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '10px',
          padding: '1rem'
        }}>
          <h4>Troubleshooting:</h4>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
            <li>Make sure you allow microphone access when prompted</li>
            <li>Check that your microphone is working</li>
            <li>Speak clearly and at normal volume</li>
            <li>Use Chrome, Edge, or Safari for best support</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BasicSpeechTest;