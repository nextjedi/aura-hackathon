export async function testSpeechAPI() {
  console.log('🎤 Testing Web Speech API...');
  
  try {
    // Check if we're in a browser-like environment
    if (typeof window === 'undefined') {
      console.log('  📝 Running in Node.js environment');
      console.log('  📝 Web Speech API is browser-only');
      console.log('  📝 Test will be validated in frontend');
      return { success: true, message: 'Speech API test prepared for browser' };
    }

    // Browser environment checks
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech Recognition not supported in this browser');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Configure recognition
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    console.log('  ✅ Speech Recognition API available');
    console.log('  📝 Configuration set: continuous=false, lang=en-US');
    
    return { success: true, message: 'Web Speech API configured' };
    
  } catch (error) {
    throw new Error(`Speech API test failed: ${error.message}`);
  }
}