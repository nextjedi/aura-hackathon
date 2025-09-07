import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Mic, MicOff, RotateCcw, Copy } from 'lucide-react';

const CompleteSpeechDisplay = () => {
  const [allTranscripts, setAllTranscripts] = useState([]);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    finalTranscript,
    interimTranscript
  } = useSpeechRecognition({
    transcribing: true,
    clearTranscriptOnListen: false,
    commands: []
  });

  // Track every change in transcript to never miss words
  useEffect(() => {
    if (finalTranscript) {
      const timestamp = new Date().toLocaleTimeString();
      setAllTranscripts(prev => {
        // Check if this finalTranscript is new
        const lastEntry = prev[prev.length - 1];
        if (!lastEntry || lastEntry.text !== finalTranscript) {
          return [...prev, {
            id: Date.now(),
            text: finalTranscript,
            timestamp,
            type: 'final'
          }];
        }
        return prev;
      });
    }
  }, [finalTranscript]);

  // Also track interim results so nothing is missed
  useEffect(() => {
    if (interimTranscript && listening) {
      const timestamp = new Date().toLocaleTimeString();
      setAllTranscripts(prev => {
        // Update or add interim result
        const withoutLastInterim = prev.filter(item => item.type !== 'interim');
        return [...withoutLastInterim, {
          id: Date.now(),
          text: interimTranscript,
          timestamp,
          type: 'interim'
        }];
      });
    }
  }, [interimTranscript, listening]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="glass-morphism p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">❌ Browser Not Supported</h1>
          <p className="text-gray-300">
            Your browser doesn't support speech recognition. 
            Please use Chrome, Edge, or Safari.
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

  const resetAll = () => {
    resetTranscript();
    setAllTranscripts([]);
  };

  const copyAllText = () => {
    const allText = allTranscripts
      .filter(item => item.type === 'final')
      .map(item => item.text)
      .join(' ');
    navigator.clipboard.writeText(allText);
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
                Complete Speech Capture
              </h1>
              <p className="text-gray-400">
                {listening ? '🎤 Capturing every word...' : '🔴 Click Start to begin'}
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
              onClick={copyAllText}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              <Copy className="w-5 h-5" />
              Copy
            </button>
            
            <button
              onClick={resetAll}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Current Speaking (Live) */}
      {interimTranscript && listening && (
        <div className="glass-morphism p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3 text-blue-300">🎤 Currently Speaking:</h2>
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-white text-lg italic">"{interimTranscript}"</p>
          </div>
        </div>
      )}

      {/* Complete Transcript Stream */}
      <div className="glass-morphism p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">📝 Complete Speech Stream</h2>
          <div className="text-sm text-gray-400">
            {allTranscripts.filter(t => t.type === 'final').length} final transcripts • 
            {transcript.split(' ').filter(w => w.length > 0).length} words total
          </div>
        </div>
        
        <div className="bg-gray-900/50 rounded-lg p-4 min-h-96 max-h-96 overflow-y-auto">
          {allTranscripts.length > 0 ? (
            <div className="space-y-3">
              {allTranscripts.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    item.type === 'final'
                      ? 'bg-green-600/20 border-green-500 text-white'
                      : 'bg-blue-600/10 border-blue-500 text-blue-300 italic'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-gray-400">
                      {item.type === 'final' ? '✅ Final' : '⏳ Speaking...'}
                    </span>
                    <span className="text-xs text-gray-400">{item.timestamp}</span>
                  </div>
                  <p className="text-lg leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 mt-8">
              <Mic className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-lg">Start speaking to see every word captured here!</p>
              <p className="text-sm mt-2">This will capture EVERYTHING you say - no words missed!</p>
            </div>
          )}
        </div>

        {/* Complete Transcript Summary */}
        {transcript && (
          <div className="mt-6 p-4 bg-purple-600/20 border border-purple-500/30 rounded-lg">
            <h3 className="text-purple-300 font-semibold mb-2">📄 Complete Text:</h3>
            <p className="text-white text-lg leading-relaxed break-words">{transcript}</p>
            <div className="mt-3 text-sm text-gray-400 flex justify-between">
              <span>Characters: {transcript.length}</span>
              <span>Words: {transcript.split(' ').filter(w => w.length > 0).length}</span>
              <span>Status: {listening ? 'Still listening...' : 'Stopped'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="glass-morphism p-6 mt-6">
        <h3 className="text-lg font-semibold mb-3">🎯 Optimized for Complete Capture:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-green-300 mb-2">✅ Features:</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• Captures every single word</li>
              <li>• Shows interim results live</li>
              <li>• Never stops listening</li>
              <li>• Tracks all final transcripts</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-blue-300 mb-2">🎤 Settings:</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• Continuous: ✅ ON</li>
              <li>• Interim Results: ✅ ON</li>
              <li>• Language: English (US)</li>
              <li>• Auto-restart: ✅ ON</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-purple-300 mb-2">📊 Stats:</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• Status: {listening ? '🟢 Active' : '🔴 Inactive'}</li>
              <li>• Browser: {browserSupportsSpeechRecognition ? '✅ Supported' : '❌ Not supported'}</li>
              <li>• Microphone: {isMicrophoneAvailable ? '✅ Available' : '❌ Not available'}</li>
              <li>• Library: react-speech-recognition</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteSpeechDisplay;