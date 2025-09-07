import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import CameraCapture from './components/CameraCapture';
import VoiceInterface from './components/VoiceInterface';
import StyleBoard from './components/StyleBoard';

function App() {
  const [phase, setPhase] = useState('scan'); // scan, conversation, styleboard
  const [isDemo, setIsDemo] = useState(false);
  const [selectedClothing, setSelectedClothing] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);

  useEffect(() => {
    // Check for demo mode
    const urlParams = new URLSearchParams(window.location.search);
    setIsDemo(urlParams.get('demo') === 'true');
    
    // Keyboard shortcut for demo mode
    const handleKeyPress = (e) => {
      if (e.key === 'd' && e.ctrlKey) {
        setIsDemo(prev => !prev);
        console.log('Demo mode:', !isDemo);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isDemo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header */}
      <header className="p-6 flex items-center justify-between glass-morphism m-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent aura-gradient">
            AURA
          </h1>
        </div>
        <span className="text-sm text-gray-400">
          AI Style Consultant
        </span>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        {phase === 'scan' && (
          <CameraCapture 
            onCapture={(clothing) => {
              setSelectedClothing(clothing);
              setPhase('conversation');
            }}
            isDemo={isDemo}
          />
        )}
        
        {phase === 'conversation' && (
          <VoiceInterface
            selectedClothing={selectedClothing}
            onImageGenerated={(styleData) => {
              setGeneratedImage(styleData);
              setPhase('styleboard');
            }}
            isDemo={isDemo}
          />
        )}
        
        {phase === 'styleboard' && (
          <StyleBoard
            generatedImage={generatedImage}
            selectedClothing={selectedClothing}
            onReset={() => {
              setPhase('scan');
              setSelectedClothing(null);
              setGeneratedImage(null);
            }}
          />
        )}
      </main>

      {/* Demo Mode Indicator */}
      {isDemo && (
        <div className="fixed bottom-4 right-4 bg-yellow-600 text-black px-4 py-2 rounded-lg">
          Demo Mode (Ctrl+D to toggle)
        </div>
      )}
    </div>
  );
}

export default App
