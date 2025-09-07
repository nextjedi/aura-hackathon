import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, SkipForward, CheckCircle, Clock } from 'lucide-react';

const DemoFlowOptimizer = ({ 
  onPhaseChange, 
  currentPhase, 
  isActive = false,
  onComplete 
}) => {
  const [demoTimer, setDemoTimer] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Optimized 2-minute demo flow
  const demoFlow = [
    {
      id: 'intro',
      name: 'Introduction',
      duration: 10, // 10 seconds
      phase: 'conversation',
      description: 'Welcome to AURA - AI Style Consultant',
      autoActions: [
        'Show AURA logo and tagline',
        'Brief explanation of AI styling capabilities'
      ],
      demoScript: "Welcome to AURA, your AI-powered style consultant. I'll help you create the perfect look in under 2 minutes."
    },
    {
      id: 'scan',
      name: 'Clothing Scan',
      duration: 15, // 15 seconds
      phase: 'scan',
      description: 'Scan clothing item or use demo asset',
      autoActions: [
        'Show camera interface',
        'Auto-select demo clothing item',
        'Display clothing analysis'
      ],
      demoScript: "Let me analyze your clothing. I can see this is a navy business suit - perfect for professional occasions."
    },
    {
      id: 'conversation',
      name: 'Context Gathering',
      duration: 20, // 20 seconds
      phase: 'conversation',
      description: 'Quick conversation about occasion and preferences',
      autoActions: [
        'Show conversation interface',
        'Auto-fill demo responses',
        'Display context analysis'
      ],
      demoScript: "I understand you need styling for a business meeting at an upscale restaurant. Let me create the perfect look."
    },
    {
      id: 'analysis',
      name: 'AI Analysis',
      duration: 15, // 15 seconds
      phase: 'conversation',
      description: 'Show AI processing body type, colors, and style recommendations',
      autoActions: [
        'Display body analysis',
        'Show color recommendations',
        'Present style suggestions'
      ],
      demoScript: "Analyzing your body type, preferred colors, and occasion requirements. Generating personalized recommendations."
    },
    {
      id: 'visualization',
      name: 'Style Visualization',
      duration: 25, // 25 seconds
      phase: 'styleboard',
      description: 'Generate and display outfit visualization',
      autoActions: [
        'Show outfit generation process',
        'Display generated style image',
        'Present styling recommendations'
      ],
      demoScript: "Here's your perfect look - navy suit with complementary accessories, perfectly tailored for your business meeting."
    },
    {
      id: 'couple',
      name: 'Couple Feature',
      duration: 20, // 20 seconds
      phase: 'couple',
      description: 'Demonstrate couple visualization with celebrity',
      autoActions: [
        'Show couple visualization interface',
        'Generate couple image with celebrity',
        'Display coordinated styling'
      ],
      demoScript: "Want to see how you'd look with a celebrity partner? Here's you and Ryan Gosling at a red carpet event."
    },
    {
      id: 'shopping',
      name: 'Shopping Integration',
      duration: 15, // 15 seconds
      phase: 'styleboard',
      description: 'Show curated shopping suggestions',
      autoActions: [
        'Display shopping interface',
        'Show curated products',
        'Demonstrate affiliate links'
      ],
      demoScript: "Ready to shop? Here are personally curated items from Amazon that match your perfect style."
    }
  ];

  // Calculate total demo time
  const totalDemoTime = demoFlow.reduce((total, step) => total + step.duration, 0);

  useEffect(() => {
    let interval;
    if (isRunning && isActive) {
      interval = setInterval(() => {
        setDemoTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, isActive]);

  useEffect(() => {
    if (!isRunning) return;

    // Auto-advance through demo steps based on timing
    let accumulatedTime = 0;
    for (let i = 0; i < demoFlow.length; i++) {
      accumulatedTime += demoFlow[i].duration;
      if (demoTimer >= accumulatedTime - demoFlow[i].duration && demoTimer < accumulatedTime) {
        if (currentStep !== i) {
          setCurrentStep(i);
          onPhaseChange(demoFlow[i].phase);
        }
        break;
      }
    }

    // Complete demo when timer reaches total time
    if (demoTimer >= totalDemoTime) {
      setIsRunning(false);
      setCompletedSteps(new Set(demoFlow.map((_, i) => i)));
      onComplete && onComplete();
    }
  }, [demoTimer, isRunning, currentStep, totalDemoTime, onPhaseChange, onComplete]);

  const startDemo = () => {
    setIsRunning(true);
    setDemoTimer(0);
    setCurrentStep(0);
    setCompletedSteps(new Set());
    onPhaseChange(demoFlow[0].phase);
  };

  const pauseDemo = () => {
    setIsRunning(false);
  };

  const skipToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < demoFlow.length) {
      setCurrentStep(stepIndex);
      const accumulatedTime = demoFlow.slice(0, stepIndex).reduce((total, step) => total + step.duration, 0);
      setDemoTimer(accumulatedTime);
      onPhaseChange(demoFlow[stepIndex].phase);
    }
  };

  const completeCurrentStep = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < demoFlow.length - 1) {
      skipToStep(currentStep + 1);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentStepProgress = () => {
    if (!isRunning) return 0;
    const accumulatedTime = demoFlow.slice(0, currentStep).reduce((total, step) => total + step.duration, 0);
    const stepStartTime = accumulatedTime;
    const stepDuration = demoFlow[currentStep]?.duration || 1;
    const stepProgress = Math.max(0, Math.min(100, ((demoTimer - stepStartTime) / stepDuration) * 100));
    return stepProgress;
  };

  const getOverallProgress = () => {
    return Math.max(0, Math.min(100, (demoTimer / totalDemoTime) * 100));
  };

  if (!isActive) return null;

  return (
    <div className="demo-flow-optimizer fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 shadow-2xl border border-purple-500/30">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Timer className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">Demo Flow Controller</h3>
            <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-xs">
              2-Minute Demo
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">
              {formatTime(demoTimer)} / {formatTime(totalDemoTime)}
            </span>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Overall Progress</span>
            <span className="text-sm text-purple-400">{Math.round(getOverallProgress())}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${getOverallProgress()}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        {demoFlow[currentStep] && (
          <div className="mb-4 p-3 bg-purple-600/10 rounded-lg border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium">
                Step {currentStep + 1}: {demoFlow[currentStep].name}
              </h4>
              <span className="text-xs text-purple-300">
                {demoFlow[currentStep].duration}s
              </span>
            </div>
            <p className="text-gray-300 text-sm mb-2">
              {demoFlow[currentStep].description}
            </p>
            <div className="w-full bg-gray-600 rounded-full h-1 mb-2">
              <div 
                className="bg-purple-400 h-1 rounded-full transition-all duration-300"
                style={{ width: `${getCurrentStepProgress()}%` }}
              />
            </div>
            {demoFlow[currentStep].demoScript && (
              <div className="bg-gray-800/50 p-2 rounded text-xs text-gray-300 italic">
                ""{demoFlow[currentStep].demoScript}""
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {!isRunning ? (
              <button
                onClick={startDemo}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2 text-white text-sm font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                Start Demo
              </button>
            ) : (
              <button
                onClick={pauseDemo}
                className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg flex items-center gap-2 text-white text-sm font-medium transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}

            <button
              onClick={completeCurrentStep}
              disabled={!isRunning}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 text-white text-sm font-medium transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Complete Step
            </button>

            {currentStep < demoFlow.length - 1 && (
              <button
                onClick={() => skipToStep(currentStep + 1)}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center gap-2 text-white text-sm font-medium transition-colors"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>
            )}
          </div>

          {/* Step Indicators */}
          <div className="flex gap-1">
            {demoFlow.map((step, index) => (
              <button
                key={step.id}
                onClick={() => skipToStep(index)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                  completedSteps.has(index)
                    ? 'bg-green-600 text-white'
                    : index === currentStep
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
                title={step.name}
              >
                {completedSteps.has(index) ? (
                  <CheckCircle className="w-4 h-4 mx-auto" />
                ) : (
                  index + 1
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Demo Tips */}
        <div className="mt-3 p-2 bg-blue-600/10 rounded border border-blue-500/20">
          <p className="text-blue-300 text-xs">
            💡 <strong>Demo Tips:</strong> This controller helps you deliver a perfect 2-minute AURA demonstration. 
            Each step is timed for maximum impact. Use the script provided for consistent messaging.
          </p>
        </div>

      </div>
    </div>
  );
};

export default DemoFlowOptimizer;