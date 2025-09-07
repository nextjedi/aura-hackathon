import React, { useState, useEffect } from 'react';
import { Shield, Zap, MessageSquare, Image, Users, ShoppingBag } from 'lucide-react';

const DemoModeSafetyNet = ({ 
  isActive = false, 
  currentPhase,
  onOverride,
  onSafeResponse 
}) => {
  const [safetyMode, setSafetyMode] = useState('auto'); // auto, manual, god-mode
  const [currentScript, setCurrentScript] = useState(0);
  const [isOverriding, setIsOverriding] = useState(false);

  // Pre-scripted responses for perfect demos
  const demoScripts = {
    conversation: [
      {
        trigger: 'voice input received',
        response: "I can see you're dressed professionally today. Tell me about the occasion you're preparing for.",
        context: 'opening conversation'
      },
      {
        trigger: 'occasion mentioned',
        response: "A business meeting at an upscale restaurant - excellent choice for networking. I'll analyze your current style and suggest the perfect look.",
        context: 'goal understanding'
      },
      {
        trigger: 'style preferences',
        response: "Based on your body type and coloring, I recommend a navy single-breasted suit with a crisp white shirt. The slim fit will accentuate your athletic build.",
        context: 'recommendations'
      }
    ],
    scan: [
      {
        trigger: 'clothing capture',
        response: "Perfect! I can see this is a high-quality navy business suit. The fabric appears to be wool with a subtle texture - excellent choice for professional settings.",
        context: 'clothing analysis',
        mockData: {
          type: 'suit',
          color: 'navy',
          style: 'business',
          fabric: 'wool',
          confidence: 0.95
        }
      },
      {
        trigger: 'analysis complete',
        response: "Analysis complete! This suit pairs beautifully with your skin tone and body type. I'm calculating the perfect accessories now.",
        context: 'analysis summary'
      }
    ],
    styleboard: [
      {
        trigger: 'visualization request',
        response: "Generating your perfect look now... This combines classic elegance with modern sophistication.",
        context: 'image generation',
        mockImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...' // Mock base64 image
      },
      {
        trigger: 'style complete',
        response: "Here's your complete look! Navy suit with burgundy silk tie, silver watch, and black Oxford shoes. This ensemble commands respect while remaining approachable.",
        context: 'style presentation'
      },
      {
        trigger: 'shopping request',
        response: "I've curated premium items from trusted brands that match your style perfectly. These pieces are currently available with exclusive discounts.",
        context: 'shopping integration'
      }
    ],
    couple: [
      {
        trigger: 'couple visualization',
        response: "Let's create a stunning couple visualization! I'll coordinate your look with Ryan Gosling's classic Hollywood style for a red carpet appearance.",
        context: 'couple introduction'
      },
      {
        trigger: 'couple complete',
        response: "Magnificent! You both look incredible together. The complementary styling creates perfect visual harmony while maintaining individual sophistication.",
        context: 'couple presentation'
      }
    ]
  };

  // Fallback responses for unexpected situations
  const emergencyResponses = [
    "Let me analyze that for you...",
    "Excellent choice! That will look fantastic.",
    "I'm processing your request now...",
    "Perfect! This fits beautifully with your style profile.",
    "Great question! Let me show you the perfect solution.",
    "That's exactly what I was thinking too!",
    "Your style instincts are spot-on."
  ];

  // Error recovery responses
  const errorRecoveryResponses = {
    api_failure: "I'm experiencing some technical difficulties, but I can see you have excellent taste! Let me use my advanced analysis to continue.",
    timeout: "Processing is taking longer than expected, but I can already tell this is going to be an amazing look.",
    no_response: "My sensors are picking up incredible style potential here. Let me share what I'm seeing.",
    general: "No problem at all! Let me approach this differently and show you something amazing."
  };

  // Demo flow progression
  const progressFlow = {
    'conversation': 'scan',
    'scan': 'styleboard',
    'styleboard': 'couple',
    'couple': 'shopping'
  };

  useEffect(() => {
    // Monitor for potential demo failures and activate safety net
    const handleDemoFailure = (error) => {
      console.log('🛡️ Demo safety net activated:', error);
      setIsOverriding(true);
      
      // Auto-recover after brief delay
      setTimeout(() => {
        setIsOverriding(false);
        provideSafeResponse('error_recovery');
      }, 1500);
    };

    // Listen for various failure modes
    window.addEventListener('demo-error', handleDemoFailure);
    window.addEventListener('unhandledrejection', handleDemoFailure);
    
    return () => {
      window.removeEventListener('demo-error', handleDemoFailure);
      window.removeEventListener('unhandledrejection', handleDemoFailure);
    };
  }, []);

  const provideSafeResponse = (trigger, context = null) => {
    const phaseScripts = demoScripts[currentPhase] || [];
    const relevantScript = phaseScripts.find(script => 
      script.trigger === trigger || script.context === context
    );

    if (relevantScript) {
      console.log('🎭 Using scripted response:', relevantScript.response);
      onSafeResponse && onSafeResponse({
        response: relevantScript.response,
        mockData: relevantScript.mockData,
        mockImage: relevantScript.mockImage,
        context: relevantScript.context
      });
    } else {
      // Use emergency response
      const emergencyResponse = emergencyResponses[Math.floor(Math.random() * emergencyResponses.length)];
      console.log('🚨 Using emergency response:', emergencyResponse);
      onSafeResponse && onSafeResponse({
        response: emergencyResponse,
        context: 'emergency_fallback'
      });
    }
  };

  const handleGodModeAdvance = () => {
    // Auto-advance to next logical phase
    const nextPhase = progressFlow[currentPhase];
    if (nextPhase && onOverride) {
      onOverride(nextPhase);
      provideSafeResponse('phase_transition', nextPhase);
    }
  };

  const handleManualIntervention = (responseType) => {
    if (responseType === 'error_recovery') {
      const recovery = errorRecoveryResponses.general;
      onSafeResponse && onSafeResponse({
        response: recovery,
        context: 'manual_recovery'
      });
    } else {
      provideSafeResponse(responseType);
    }
  };

  if (!isActive) return null;

  return (
    <div className="demo-safety-net fixed top-4 right-4 z-50">
      <div className="bg-green-900/95 backdrop-blur-sm rounded-lg p-4 shadow-2xl border border-green-500/30 max-w-xs">
        
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-green-400" />
          <h3 className="text-green-100 font-semibold text-sm">Safety Net</h3>
          {isOverriding && (
            <div className="ml-auto">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {/* Status */}
        <div className="mb-3 p-2 bg-green-800/30 rounded text-xs">
          <div className="flex justify-between items-center mb-1">
            <span className="text-green-300">Mode:</span>
            <span className="text-green-100 font-medium">{safetyMode}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-green-300">Phase:</span>
            <span className="text-green-100 font-medium">{currentPhase}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2 mb-3">
          <div className="flex gap-1">
            <button
              onClick={() => provideSafeResponse('voice_input')}
              className="flex-1 bg-blue-600/80 hover:bg-blue-600 px-2 py-1 rounded text-xs text-white flex items-center justify-center gap-1"
              title="Simulate voice response"
            >
              <MessageSquare className="w-3 h-3" />
              Voice
            </button>
            <button
              onClick={() => provideSafeResponse('analysis_complete')}
              className="flex-1 bg-purple-600/80 hover:bg-purple-600 px-2 py-1 rounded text-xs text-white flex items-center justify-center gap-1"
              title="Complete analysis"
            >
              <Zap className="w-3 h-3" />
              Analyze
            </button>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => provideSafeResponse('visualization_request')}
              className="flex-1 bg-pink-600/80 hover:bg-pink-600 px-2 py-1 rounded text-xs text-white flex items-center justify-center gap-1"
              title="Generate visualization"
            >
              <Image className="w-3 h-3" />
              Visual
            </button>
            <button
              onClick={() => provideSafeResponse('couple_visualization')}
              className="flex-1 bg-purple-600/80 hover:bg-purple-600 px-2 py-1 rounded text-xs text-white flex items-center justify-center gap-1"
              title="Couple visualization"
            >
              <Users className="w-3 h-3" />
              Couple
            </button>
          </div>

          <button
            onClick={() => provideSafeResponse('shopping_request')}
            className="w-full bg-green-600/80 hover:bg-green-600 px-2 py-1 rounded text-xs text-white flex items-center justify-center gap-1"
          >
            <ShoppingBag className="w-3 h-3" />
            Shopping
          </button>
        </div>

        {/* God Mode */}
        <div className="border-t border-green-500/20 pt-3">
          <button
            onClick={handleGodModeAdvance}
            className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 px-3 py-2 rounded text-sm text-white font-medium flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            God Mode Advance
          </button>
        </div>

        {/* Emergency Recovery */}
        {isOverriding && (
          <div className="mt-3 p-2 bg-red-600/20 rounded border border-red-500/30">
            <div className="text-red-300 text-xs text-center mb-2">
              🚨 Auto-recovering...
            </div>
            <button
              onClick={() => handleManualIntervention('error_recovery')}
              className="w-full bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs text-white"
            >
              Manual Override
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-3 text-xs text-green-300 text-center">
          Perfect demo responses for any situation
        </div>
      </div>
    </div>
  );
};

export default DemoModeSafetyNet;