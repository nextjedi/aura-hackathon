class SpeechService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onStartCallback = null;
    this.onEndCallback = null;
    
    this.initializeRecognition();
  }

  initializeRecognition() {
    // Check for Web Speech API support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      return false;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configure recognition settings
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 3;

    // Set up event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('Speech recognition started');
      this.onStartCallback?.();
    };

    this.recognition.onresult = (event) => {
      this.handleResults(event);
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      this.handleError(event);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('Speech recognition ended');
      this.onEndCallback?.();
    };

    return true;
  }

  handleResults(event) {
    let finalTranscript = '';
    let interimTranscript = '';
    let confidence = 0;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      
      if (result.isFinal) {
        finalTranscript += transcript;
        confidence = result[0].confidence;
      } else {
        interimTranscript += transcript;
      }
    }

    this.onResultCallback?.({
      final: finalTranscript,
      interim: interimTranscript,
      confidence: confidence,
      isFinal: finalTranscript.length > 0
    });
  }

  handleError(event) {
    const errorMessages = {
      'network': 'Network error occurred during speech recognition',
      'not-allowed': 'Microphone access denied. Please enable microphone permissions.',
      'no-speech': 'No speech detected. Please speak clearly.',
      'aborted': 'Speech recognition was aborted',
      'audio-capture': 'Audio capture failed',
      'bad-grammar': 'Grammar compilation failed',
      'language-not-supported': 'Language not supported',
      'service-not-allowed': 'Speech recognition service not allowed'
    };

    const message = errorMessages[event.error] || `Unknown speech recognition error: ${event.error}`;
    
    this.onErrorCallback?.({
      error: event.error,
      message: message
    });
  }

  start() {
    if (!this.recognition) {
      console.error('Speech recognition not initialized');
      return false;
    }

    if (this.isListening) {
      console.log('Speech recognition already running');
      return true;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      return false;
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  abort() {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  // Event handler setters
  onResult(callback) {
    this.onResultCallback = callback;
  }

  onError(callback) {
    this.onErrorCallback = callback;
  }

  onStart(callback) {
    this.onStartCallback = callback;
  }

  onEnd(callback) {
    this.onEndCallback = callback;
  }

  // Utility methods
  isSupported() {
    return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  }

  getListeningState() {
    return this.isListening;
  }

  // Wake word detection helper
  containsWakeWord(text, wakeWords = ['hey mandy', 'mandy', 'hey aura', 'aura']) {
    const lowerText = text.toLowerCase().trim();
    return wakeWords.some(word => {
      // Check for exact phrase or word at end of sentence
      return lowerText.includes(word) || lowerText.endsWith(word.split(' ').pop());
    });
  }

  // Extract command after wake word
  extractCommand(text, wakeWords = ['hey mandy', 'mandy', 'hey aura', 'aura']) {
    const lowerText = text.toLowerCase();
    
    for (const wakeWord of wakeWords) {
      const index = lowerText.lastIndexOf(wakeWord);
      if (index !== -1) {
        const command = text.substring(index + wakeWord.length).trim();
        return command.length > 0 ? command : null;
      }
    }
    
    return null;
  }
}

// Create singleton instance
export const speechService = new SpeechService();

// Named export for class
export { SpeechService };

// Default export
export default speechService;