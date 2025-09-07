import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import CameraCapture from './components/CameraCapture';
import VoiceInterface from './components/VoiceInterface';
import StyleBoard from './components/StyleBoard';
import WakeWordDetector from './components/WakeWordDetector';
import ConversationManager from './components/ConversationManager';
import TestingInterface from './components/TestingInterface';
import SimpleSpeechDisplay from './components/SimpleSpeechDisplay';
import BasicSpeechTest from './components/BasicSpeechTest';
import ExactTestCopy from './components/ExactTestCopy';
import ProperSpeechDisplay from './components/ProperSpeechDisplay';
import CompleteSpeechDisplay from './components/CompleteSpeechDisplay';
import RawSpeechCapture from './components/RawSpeechCapture';
import AudioDiagnostic from './components/AudioDiagnostic';
import CoupleVisualizer from './components/CoupleVisualizer';
import DemoFlowOptimizer from './components/DemoFlowOptimizer';
import DemoModeSafetyNet from './components/DemoModeSafetyNet';

function App() {
  const [phase, setPhase] = useState('conversation'); // audio, raw, complete, proper, exact, basic, speech, conversation, testing, scan, styleboard, couple
  const [isDemo, setIsDemo] = useState(false);
  const [selectedClothing, setSelectedClothing] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [conversationContext, setConversationContext] = useState(null);
  const [demoFlowActive, setDemoFlowActive] = useState(false);

  useEffect(() => {
    // Check for demo mode
    const urlParams = new URLSearchParams(window.location.search);
    setIsDemo(urlParams.get('demo') === 'true');
    
    // Check for demo flow mode
    setDemoFlowActive(urlParams.get('flow') === 'true');
    
    // Keyboard shortcuts for demo control
    const handleKeyPress = (e) => {
      if (e.key === 'f' && e.altKey) {
        e.preventDefault();
        setDemoFlowActive(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleWakeWord = (transcript) => {
    console.log('Wake word detected:', transcript);
    setPhase('conversation');
  };

  const handleContextGathered = (context) => {
    console.log('Context gathered:', context);
    setConversationContext(context);
    // Move to style generation phase
    setPhase('styleboard');
  };

  const handleSpeechInput = (transcript) => {
    console.log('Speech input:', transcript);
    // This will be handled by ConversationManager
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Header */}
      {phase !== 'testing' && phase !== 'speech' && phase !== 'basic' && phase !== 'exact' && phase !== 'proper' && phase !== 'complete' && phase !== 'raw' && phase !== 'audio' && (
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
      )}


      {/* Main Content */}
      <main className={phase === 'testing' || phase === 'speech' || phase === 'basic' || phase === 'exact' || phase === 'proper' || phase === 'complete' || phase === 'raw' || phase === 'audio' ? '' : 'container mx-auto p-4'}>
        {phase === 'audio' && <AudioDiagnostic />}
        {phase === 'raw' && <RawSpeechCapture />}
        {phase === 'complete' && <CompleteSpeechDisplay />}
        {phase === 'proper' && <ProperSpeechDisplay />}
        {phase === 'exact' && <ExactTestCopy />}
        {phase === 'basic' && <BasicSpeechTest />}
        {phase === 'speech' && <SimpleSpeechDisplay />}
        {phase === 'testing' && <TestingInterface />}
        
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
          <ConversationManager
            onContextGathered={handleContextGathered}
            isDemo={isDemo}
            selectedClothing={selectedClothing}
          />
        )}

        {phase === 'old-conversation' && (
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
            conversationContext={conversationContext}
            onReset={() => {
              setPhase('conversation');
              setSelectedClothing(null);
              setGeneratedImage(null);
              setConversationContext(null);
            }}
            onCoupleVisualization={() => {
              setPhase('couple');
            }}
          />
        )}

        {phase === 'couple' && (
          <CoupleVisualizer
            context={conversationContext}
            clothingAnalysis={selectedClothing}
            locationAnalysis={conversationContext?.locationAnalysis}
            bodyAnalysis={conversationContext?.bodyAnalysis}
            onVisualizationComplete={(coupleVisualization) => {
              console.log('Couple visualization completed:', coupleVisualization);
              // Stay on couple visualizer or could redirect to styleboard
            }}
          />
        )}
      </main>

      {/* Mode Indicators */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        {isDemo && (
          <div className="bg-yellow-600 text-black px-4 py-2 rounded-lg text-sm font-medium">
            Demo Mode
          </div>
        )}
        {demoFlowActive && (
          <div className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Flow Control Active
          </div>
        )}
        {!demoFlowActive && (
          <div className="bg-gray-600/80 text-gray-300 px-3 py-1 rounded text-xs">
            Alt+f for demo flow
          </div>
        )}
      </div>

      {/* Demo Flow Optimizer */}
      <DemoFlowOptimizer
        isActive={demoFlowActive}
        currentPhase={phase}
        onPhaseChange={(newPhase) => {
          console.log('Demo flow changing phase to:', newPhase);
          setPhase(newPhase);
          
          // Auto-populate demo data based on phase
          if (newPhase === 'conversation' && !conversationContext) {
            setConversationContext({
              goal: 'business meeting',
              location: 'upscale restaurant',
              relationship: 'professional',
              bodyAnalysis: {
                body_type: 'athletic',
                suit_recommendations: {
                  jacket_style: 'single-breasted',
                  jacket_fit: 'slim',
                  lapel_style: 'notched'
                },
                color_recommendations: {
                  best_colors: ['navy', 'charcoal', 'burgundy']
                }
              }
            });
          }
          
          if (newPhase === 'scan' && !selectedClothing) {
            setSelectedClothing({
              type: 'suit',
              color: 'navy',
              style: 'business',
              confidence: 0.95
            });
          }
        }}
        onComplete={() => {
          console.log('Demo flow completed successfully!');
        }}
      />

      {/* Demo Mode Safety Net */}
      <DemoModeSafetyNet
        isActive={isDemo || demoFlowActive}
        currentPhase={phase}
        onOverride={(newPhase) => {
          console.log('Safety net override to phase:', newPhase);
          setPhase(newPhase);
        }}
        onSafeResponse={(safeResponse) => {
          console.log('Safety net providing response:', safeResponse);
          
          // Apply mock data if provided
          if (safeResponse.mockData) {
            if (safeResponse.context === 'clothing analysis') {
              setSelectedClothing(safeResponse.mockData);
            }
          }
          
          // Display the response (this could be shown in a notification or TTS)
          // For now, we'll log it - in a real implementation, this would trigger TTS
          console.log('🎭 AURA says:', safeResponse.response);
        }}
      />
    </div>
  );
}

export default App
