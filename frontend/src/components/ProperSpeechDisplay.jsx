import React from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Mic, MicOff, RotateCcw } from 'lucide-react';

const ProperSpeechDisplay = () => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    finalTranscript,
    interimTranscript
  } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="glass-morphism p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">❌ Browser Not Supported</h1>
          <p className="text-gray-300">
            Your browser doesn't support speech recognition. 
            Please use Chrome, Edge, or Safari for the best experience.
          </p>
        </div>
      </div>
    );
  }

  if (!isMicrophoneAvailable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="glass-morphism p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">🎤 Microphone Required</h1>
          <p className="text-gray-300">
            Please allow microphone access to use speech recognition.
            Click the microphone icon in your browser's address bar.
          </p>
        </div>
      </div>
    );
  }

  const startListening = () => {
    SpeechRecognition.startListening({ 
      continuous: true, 
      language: 'en-US',
      interimResults: true
    });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6">
      {/* Header */}
      <div className="glass-morphism p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              listening 
                ? 'bg-gradient-to-br from-green-500 to-emerald-500 animate-pulse shadow-lg shadow-green-500/25' 
                : 'bg-gray-600'
            }`}>
              {listening ? (
                <Mic className="w-8 h-8 text-white" />
              ) : (
                <MicOff className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Speech Recognition
              </h1>
              <p className="text-gray-400">
                {listening ? '🎤 Listening continuously...' : '🔴 Click Start to begin'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={startListening}
              disabled={listening}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              <Mic className="w-5 h-5" />
              {listening ? 'Listening...' : 'Start'}
            </button>
            
            <button
              onClick={stopListening}
              disabled={!listening}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-colors font-semibold"
            >
              Stop
            </button>
            
            <button
              onClick={resetTranscript}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Current Live Transcript */}
      {interimTranscript && (
        <div className="glass-morphism p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3 text-blue-300">🎤 Currently Speaking:</h2>
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-white text-lg italic">"{interimTranscript}"</p>
          </div>
        </div>
      )}

      {/* Final Transcript Display */}
      <div className="glass-morphism p-6">
        <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
          📝 What You Said
        </h2>
        
        <div className="bg-gray-900/50 rounded-lg p-4 min-h-96">
          {transcript ? (
            <div className="space-y-4">
              {/* Show final transcript */}
              {finalTranscript && (
                <div className="p-4 bg-green-600/20 border border-green-500/30 rounded-lg">
                  <h3 className="text-green-300 font-semibold mb-2">Final Text:</h3>
                  <p className="text-white text-lg leading-relaxed">{finalTranscript}</p>
                </div>
              )}
              
              {/* Show complete transcript */}
              <div className="p-4 bg-purple-600/20 border border-purple-500/30 rounded-lg">
                <h3 className="text-purple-300 font-semibold mb-2">Complete Transcript:</h3>
                <p className="text-white text-lg leading-relaxed">{transcript}</p>
                <div className="mt-4 text-sm text-gray-400">
                  {transcript.split(' ').length} words • {transcript.length} characters
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 mt-8">
              <Mic className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-lg">Start speaking and see your words appear here!</p>
              <p className="text-sm mt-2">Click "Start" to begin continuous speech recognition</p>
            </div>
          )}
        </div>
      </div>

      {/* Status and Instructions */}
      <div className="glass-morphism p-6 mt-6">
        <h3 className="text-lg font-semibold mb-3">Instructions:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-green-300 mb-2">✅ How to Use:</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• Click "Start" to begin listening</li>
              <li>• Speak naturally and clearly</li>
              <li>• Text appears in real-time</li>
              <li>• Click "Stop" when finished</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blue-300 mb-2">🎤 Features:</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• Continuous listening</li>
              <li>• Real-time transcription</li>
              <li>• Final and interim results</li>
              <li>• Word/character count</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-purple-300 mb-2">📋 Status:</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• Browser: ✅ Supported</li>
              <li>• Microphone: {isMicrophoneAvailable ? '✅ Available' : '❌ Not available'}</li>
              <li>• Listening: {listening ? '✅ Active' : '⏸️ Inactive'}</li>
              <li>• Library: react-speech-recognition</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProperSpeechDisplay;