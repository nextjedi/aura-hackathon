import { useEffect } from 'react';

const ExactTestCopy = () => {
  useEffect(() => {
    // Exact copy of working test script logic
    let recognition = null;
    let isListening = false;
    
    // Check browser support
    function initializeSpeechRecognition() {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        document.getElementById('error').innerHTML = '❌ Speech Recognition not supported in this browser.<br>Try Chrome, Edge, or Safari.';
        document.getElementById('startBtn').disabled = true;
        return false;
      }
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      
      // Configuration
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Event handlers
      recognition.onstart = function() {
        console.log('Speech recognition started');
        isListening = true;
        updateUI();
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
        
        const transcriptDiv = document.getElementById('transcript');
        if (finalTranscript || interimTranscript) {
          transcriptDiv.innerHTML = `
            <div>
              <strong>Final:</strong> ${finalTranscript}<br>
              <em>Interim:</em> ${interimTranscript}
            </div>
          `;
          transcriptDiv.classList.add('has-content');
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
          default:
            errorMessage += event.error;
        }
        document.getElementById('error').innerHTML = errorMessage;
        stopListening();
      };
      
      recognition.onend = function() {
        console.log('Speech recognition ended');
        isListening = false;
        updateUI();
      };
      
      return true;
    }
    
    function startListening() {
      if (!recognition) return;
      
      document.getElementById('error').innerHTML = '';
      try {
        recognition.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
        document.getElementById('error').innerHTML = '❌ Failed to start speech recognition: ' + error.message;
      }
    }
    
    function stopListening() {
      if (recognition && isListening) {
        recognition.stop();
      }
    }
    
    function clearTranscript() {
      const transcriptDiv = document.getElementById('transcript');
      transcriptDiv.innerHTML = '<em>Spoken text will appear here...</em>';
      transcriptDiv.classList.remove('has-content');
      document.getElementById('error').innerHTML = '';
    }
    
    function updateUI() {
      const statusDiv = document.getElementById('status');
      const startBtn = document.getElementById('startBtn');
      const stopBtn = document.getElementById('stopBtn');
      
      if (isListening) {
        statusDiv.innerHTML = 'Listening... Speak now! 🎤';
        statusDiv.className = 'status listening';
        startBtn.disabled = true;
        stopBtn.disabled = false;
      } else {
        statusDiv.innerHTML = 'Ready to listen 🎤';
        statusDiv.className = 'status idle';
        startBtn.disabled = false;
        stopBtn.disabled = true;
      }
    }
    
    // Attach functions to window for button access
    window.startListening = startListening;
    window.stopListening = stopListening;
    window.clearTranscript = clearTranscript;
    
    // Initialize on mount
    console.log('🎤 Speech-to-Text Test Initialized');
    if (initializeSpeechRecognition()) {
      console.log('✅ Speech Recognition ready');
      updateUI();
    } else {
      console.log('❌ Speech Recognition not available');
    }
    
    // Cleanup on unmount
    return () => {
      if (recognition && isListening) {
        recognition.stop();
      }
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      padding: '2rem'
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
          🎤 Exact Test Copy
        </h1>

        <div id="status" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '1rem',
          borderRadius: '10px',
          marginBottom: '1rem',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          Initializing...
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <button 
            id="startBtn" 
            onClick={() => window.startListening?.()}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              borderRadius: '10px',
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            Start Listening
          </button>
          <button 
            id="stopBtn" 
            onClick={() => window.stopListening?.()}
            disabled
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              borderRadius: '10px',
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            Stop Listening
          </button>
          <button 
            onClick={() => window.clearTranscript?.()}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>

        <div id="transcript" style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '10px',
          padding: '2rem',
          minHeight: '200px',
          marginBottom: '1rem'
        }}>
          <em>Spoken text will appear here...</em>
        </div>

        <div id="error" style={{ color: '#ff6b6b', fontWeight: 'bold', textAlign: 'center' }}></div>
      </div>
    </div>
  );
};

export default ExactTestCopy;