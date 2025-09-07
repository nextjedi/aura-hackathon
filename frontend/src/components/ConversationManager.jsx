import { useState, useEffect, useRef } from 'react';
import { MessageCircle, MapPin, Calendar, Heart, Camera, Upload, Mic, MicOff, Eye, EyeOff, Save, Download, Trash2, MessageSquare, X } from 'lucide-react';
import WakeWordDetector from './WakeWordDetector';
import EmotionDetector from './EmotionDetector';
import AssetCapture from './AssetCapture';
import GoalExtractor from './GoalExtractor';
import ClothingAnalyzer from './ClothingAnalyzer';
import LocationAnalyzer from './LocationAnalyzer';
import BodyAnalyzer from './BodyAnalyzer';
import OutfitVisualizer from './OutfitVisualizer';
import AccessoryRecommendations from './AccessoryRecommendations';
import ErrorBoundary from './ErrorBoundary';
import speechService from '../services/speechService';
import { GeminiService } from '../services/geminiService';
import { ContextService } from '../services/contextService';
import { 
  CONVERSATION_PROMPTS, 
  STEP_TO_PROMPT_MAP, 
  formatConversationHistory, 
  getContextSummary 
} from '../constants/prompts';

const ConversationManager = ({ onContextGathered, isDemo, selectedClothing }) => {
  const [context, setContext] = useState({
    goal: '',           // What they want to achieve (occasion)
    occasion: '',       // Event/occasion type
    location: '',       // Where they're going
    relationship: '',   // Who they're going with
    timeline: '',       // When is the event
    assets: {           // Images and visual assets
      closetImage: null,
      bodyImage: null,
      venueImage: null,
      preferences: {}
    },
    shoppingPreferences: '', // Online shopping openness
    budget: '',            // Budget range
    specialRequests: '',   // Any specific requests or must-haves
    shoppingNeeds: ''      // Items needed to complete the look
  });
  
  const [currentStep, setCurrentStep] = useState('wake_word'); // wake_word -> greeting -> goal -> occasion -> location -> assets -> confirmation
  const [conversation, setConversation] = useState([]);
  const [showImageCapture, setShowImageCapture] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showWakeDetector, setShowWakeDetector] = useState(false); // Disable for text mode
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [developmentMode, setDevelopmentMode] = useState(false); // Switch to actual API mode
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [waitingForAIResponse, setWaitingForAIResponse] = useState(false);
  const [aiResponseInput, setAiResponseInput] = useState('');
  const [showEmotionDetector, setShowEmotionDetector] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [emotionHistory, setEmotionHistory] = useState([]);
  const [useActualAPI, setUseActualAPI] = useState(true);
  const [contextPersistence, setContextPersistence] = useState(true);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [showTextChat, setShowTextChat] = useState(false);
  
  // Goal extraction and asset management
  const [extractedGoals, setExtractedGoals] = useState(null);
  const [showAssetCapture, setShowAssetCapture] = useState(false);
  
  // Analysis results state
  const [clothingAnalysis, setClothingAnalysis] = useState(null);
  const [locationAnalysis, setLocationAnalysis] = useState(null);
  const [bodyAnalysis, setBodyAnalysis] = useState(null);
  const [outfitVisualization, setOutfitVisualization] = useState(null);
  const [accessoryRecommendations, setAccessoryRecommendations] = useState(null);
  const [showAnalysisComponents, setShowAnalysisComponents] = useState(false);
  
  const recognitionRef = useRef(null);
  const greetingShownRef = useRef(false);

  // Mandy's personality responses
  const mandyResponses = {
    greeting: "Hello gorgeous! I'm Mandy, your AI styling assistant. I heard you need help with something special - what's the occasion?",
    
    goal_confusion: "Oh don't worry darling! Show me your closet and let me help you impress your girlfriend!",
    
    relationship_correction: "Oh lovely! A date with your darling wife - even better! Where are you two planning to go?",
    
    location_taj: "Taj Patna! Such a romantic and elegant choice! This calls for something really special. Let me check what treasures you have in your closet.",
    
    assets_request: "Perfect! I need to see what we're working with. Can you show me your closet? You can either take a photo or upload an existing image.",
    
    body_analysis: "Wonderful choices! Now, let me take a good look at you to see what styles will make you absolutely irresistible. Improve the lighting and step back so I can see your full frame.",
    
    excitement: "Oho! Someone's getting excited! Let's explore this fashion journey together!"
  };

  // Demo script for perfect flow
  const demoFlow = [
    { type: 'ai', content: mandyResponses.greeting },
    { type: 'user', content: "I have to plan for a super special date night and I'm confused what to wear", emotion: 'confusion' },
    { type: 'ai', content: mandyResponses.goal_confusion },
    { type: 'user', content: "Oh no, not my girlfriend - I'm going on a date with my darling wife" },
    { type: 'ai', content: mandyResponses.relationship_correction },
    { type: 'user', content: "Taj Patna" },
    { type: 'ai', content: mandyResponses.location_taj },
    { type: 'action', content: 'closet_analysis' },
    { type: 'ai', content: mandyResponses.body_analysis },
    { type: 'action', content: 'body_analysis' }
  ];

  useEffect(() => {
    // Load saved context on component mount
    if (contextPersistence) {
      const savedContext = ContextService.loadContext();
      if (savedContext && savedContext.conversation.length > 0) {
        setContext(savedContext.context);
        setConversation(savedContext.conversation);
        setCurrentStep(savedContext.currentStep);
        setEmotionHistory(savedContext.emotions || []);
        setSessionInfo(ContextService.getContextSummary());
        console.log('✅ Loaded saved context:', savedContext.sessionId);
      } else {
        setSessionInfo(ContextService.getContextSummary());
      }
    }

    // Skip automatic greeting - wait for user input first

    // Initialize direct speech recognition (working pattern from diagnostic)
    if (!developmentMode && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      // Use the same settings that worked in diagnostic
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎤 Conversation speech started');
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        // Process all results
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Update current transcript display
        setCurrentTranscript(interimTranscript);

        // Handle final transcript
        if (finalTranscript.trim()) {
          console.log('📝 Final speech input:', finalTranscript.trim());
          handleSpeechInput(finalTranscript.trim());
          setCurrentTranscript(''); // Clear interim after processing final
        }
      };

      recognition.onerror = (event) => {
        console.error('❌ Speech error:', event.error);
        setIsListening(false);
        
        // Handle common errors gracefully
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          addMessage('ai', "Sorry darling, I didn't catch that. Could you try speaking again?");
        }
      };

      recognition.onend = () => {
        console.log('⏹️ Speech recognition ended');
        setIsListening(false);
        setCurrentTranscript('');
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []); // Only run once on mount

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        addMessage('ai', "Sorry, I'm having trouble with voice recognition. You can type your response.");
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const generatePromptForUser = (userInput) => {
    const conversationHistory = formatConversationHistory(conversation);
    const promptType = STEP_TO_PROMPT_MAP[currentStep] || 'greeting';
    
    // Get the appropriate prompt template
    const promptTemplate = CONVERSATION_PROMPTS[promptType];
    
    // Add emotion context to the prompt generation
    const currentEmotionContext = currentEmotion ? `\n\nCURRENT EMOTION DETECTED: ${currentEmotion.emotion} (${(currentEmotion.confidence * 100).toFixed(1)}% confidence)\nUser appears to be feeling ${currentEmotion.emotion}. Respond empathetically and adjust your tone accordingly.` : '';
    
    if (promptTemplate) {
      return promptTemplate(userInput, context, conversationHistory) + currentEmotionContext;
    }
    
    // Fallback to basic prompt if template not found
    
    return `You are Mandy, a witty, friendly, and world-class fashion expert with a charming, slightly flirty personality. Your goal is to help me find the perfect outfit for any occasion. Be encouraging, a little playful, and provide concise, helpful advice.

CURRENT SITUATION:
User just said: "${userInput}"
Current step: ${currentStep}

${getContextSummary(context)}

CONVERSATION HISTORY:
${conversationHistory}${currentEmotionContext}

Respond as Mandy would, keeping it under 50 words and being fashion-focused.

API TYPE: TEXT_ONLY (or TEXT_PLUS_IMAGE if images available)
RESPONSE:`;
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    console.log('📝 Text input received:', textInput);
    
    // Add user message
    addMessage('user', textInput.trim());
    
    if (useActualAPI) {
      // Use actual Gemini API
      await handleActualAPICall(textInput.trim());
    } else {
      // Development mode - show manual prompt
      const prompt = generatePromptForUser(textInput.trim());
      setGeneratedPrompt(prompt);
      setShowPrompt(true);
      setWaitingForAIResponse(true);
    }
    
    setTextInput('');
  };

  const handleActualAPICall = async (userInput) => {
    setIsProcessing(true);
    
    try {
      // Generate prompt with current context
      const prompt = generatePromptForUser(userInput);
      
      // Determine API type based on available images
      const hasImages = context.assets.closetImage || context.assets.bodyImage || context.assets.venueImage;
      const apiType = hasImages ? 'TEXT_PLUS_IMAGE' : 'TEXT_ONLY';
      
      // Collect images for vision API
      const images = [];
      if (context.assets.closetImage) images.push(context.assets.closetImage);
      if (context.assets.bodyImage) images.push(context.assets.bodyImage);
      if (context.assets.venueImage) images.push(context.assets.venueImage);
      
      console.log(`🤖 Calling Gemini API (${apiType}) with prompt:`, prompt.substring(0, 100) + '...');
      
      // Call Gemini API
      const response = await GeminiService.getMandyResponse(prompt, apiType, images);
      
      // Add Mandy's response
      addMessage('ai', response);
      
      // Process user input for state transitions
      processUserInput(userInput);
      
    } catch (error) {
      console.error('❌ Gemini API error:', error);
      addMessage('ai', "Oh darling, I'm having a tiny technical moment! Could you try that again? 💕");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAIResponseSubmit = (e) => {
    e.preventDefault();
    if (!aiResponseInput.trim()) return;
    
    // Add AI response as Mandy's message
    addMessage('ai', aiResponseInput.trim());
    
    // Process the response to update conversation state
    processUserInput(conversation[conversation.length - 2]?.content || ''); // Get the user's message
    
    // Reset prompt state
    setShowPrompt(false);
    setWaitingForAIResponse(false);
    setAiResponseInput('');
  };

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
  };

  const handleWakeWord = (transcript) => {
    console.log('Wake word detected in conversation:', transcript);
    setShowWakeDetector(false);
    setCurrentStep('greeting');
    
    // Skip automatic greeting - just start listening for user input
    setTimeout(() => {
      startListening();
    }, 500);
  };

  const addMessage = (sender, content, data = null) => {
    const message = {
      id: Date.now() + Math.random(), // Ensure unique IDs
      sender,
      content,
      data,
      timestamp: new Date(),
      emotion: data?.emotion || (sender === 'user' && currentEmotion ? currentEmotion.emotion : null),
      emotionData: sender === 'user' && currentEmotion ? currentEmotion : null
    };
    setConversation(prev => {
      // Check if this exact message already exists to prevent duplicates
      const exists = prev.some(msg => 
        msg.sender === sender && 
        msg.content === content && 
        Math.abs(new Date() - msg.timestamp) < 1000 // Within 1 second
      );
      
      if (exists) {
        console.log('Duplicate message prevented:', content);
        return prev;
      }
      
      const newConversation = [...prev, message];
      
      // Auto-save context if persistence is enabled
      if (contextPersistence) {
        ContextService.autoSave(context, newConversation, currentStep, emotionHistory);
        setSessionInfo(ContextService.getContextSummary());
      }
      
      return newConversation;
    });
  };

  const handleEmotionDetected = (dominantEmotionData, allExpressions) => {
    setCurrentEmotion(dominantEmotionData);
    
    // Keep track of emotion history for analytics
    setEmotionHistory(prev => {
      const newEntry = {
        ...dominantEmotionData,
        allExpressions,
        conversationStep: currentStep
      };
      
      // Keep last 10 emotion readings
      return [...prev.slice(-9), newEntry];
    });
    
    // Trigger emotion-aware responses for certain emotions
    if (dominantEmotionData.confidence > 0.7) {
      switch (dominantEmotionData.emotion) {
        case 'sad':
          // If user seems sad during styling, be extra encouraging
          if (currentStep === 'assets' || currentStep === 'body_analysis') {
            setTimeout(() => {
              addMessage('ai', "Hey lovely, I can see you might be feeling a bit down. Don't worry - we're going to find something that makes you feel absolutely amazing! ✨");
            }, 2000);
          }
          break;
        case 'surprised':
          // React to surprise during closet analysis
          if (currentStep === 'assets') {
            setTimeout(() => {
              addMessage('ai', "Ooh, I see that surprise! Did you find something hidden in your closet? Show me! 😊");
            }, 1500);
          }
          break;
        case 'happy':
          // Amplify positive emotions
          if (currentStep === 'body_analysis') {
            setTimeout(() => {
              addMessage('ai', "I love that smile! You're going to look incredible. Let's make this outfit absolutely perfect! 💫");
            }, 1500);
          }
          break;
      }
    }
  };

  const toggleEmotionDetector = () => {
    setShowEmotionDetector(!showEmotionDetector);
  };

  const updateContext = (updates) => {
    setContext(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleSpeechInput = (transcript) => {
    const userMessage = transcript.trim();
    if (!userMessage) return;

    addMessage('user', userMessage);
    processUserInput(userMessage);
  };

  const processUserInput = async (input) => {
    setIsProcessing(true);

    try {
      const lowerInput = input.toLowerCase();

      switch (currentStep) {
        case 'greeting':
          // Extract goal and detect confusion emotion
          if (lowerInput.includes('confused') || lowerInput.includes("don't know") || lowerInput.includes('help')) {
            updateContext({ 
              goal: input,
              emotion: 'confusion'
            });
            
            // AI detects girlfriend mention and responds
            if (lowerInput.includes('girlfriend') || lowerInput.includes('date')) {
              setTimeout(() => {
                addMessage('ai', mandyResponses.goal_confusion);
                setCurrentStep('relationship');
              }, 1000);
            } else {
              setTimeout(() => {
                addMessage('ai', "Tell me more about this special occasion!");
                setCurrentStep('occasion');
              }, 1000);
            }
          }
          break;

        case 'relationship':
          // User corrects relationship
          if (lowerInput.includes('wife') || lowerInput.includes('darling')) {
            updateContext({ 
              relationship: 'wife'
            });
            setTimeout(() => {
              addMessage('ai', mandyResponses.relationship_correction);
              setCurrentStep('location');
            }, 1000);
          }
          break;

        case 'location':
          // Extract location
          updateContext({ location: input });
          
          if (lowerInput.includes('taj patna') || lowerInput.includes('taj')) {
            setTimeout(() => {
              addMessage('ai', mandyResponses.location_taj);
              setCurrentStep('assets');
              setShowImageCapture(true);
            }, 1500);
          } else {
            setTimeout(() => {
              addMessage('ai', `${input}! What a lovely place. Let me see what we can put together from your closet.`);
              setCurrentStep('assets');
              setShowImageCapture(true);
            }, 1000);
          }
          break;

        case 'assets':
          // Handle preferences during asset gathering
          updateContext({
            assets: {
              ...context.assets,
              preferences: { ...context.assets.preferences, additional: input }
            }
          });
          break;

        case 'body_analysis':
          // Handle style preferences
          if (lowerInput.includes('this one') || lowerInput.includes('like')) {
            setTimeout(() => {
              addMessage('ai', mandyResponses.excitement);
              // Move to style generation
              onContextGathered?.(context);
            }, 1000);
          }
          break;
      }
    } catch (error) {
      console.error('Error processing input:', error);
      addMessage('ai', "Sorry darling, I didn't catch that. Could you repeat?");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (imageData, type) => {
    if (type === 'closet') {
      updateContext({
        assets: {
          ...context.assets,
          closetImage: imageData
        }
      });
      
      // Simulate closet analysis
      setTimeout(() => {
        addMessage('ai', "Perfect! I can see you have some excellent pieces. I spot a navy suit, charcoal grey, and that lovely brown one. " + mandyResponses.body_analysis);
        setCurrentStep('body_analysis');
        setShowImageCapture(false);
      }, 2000);
      
    } else if (type === 'body') {
      updateContext({
        assets: {
          ...context.assets,
          bodyImage: imageData
        }
      });
      
      // Move to final context gathering
      setTimeout(() => {
        addMessage('ai', "Wonderful! I can see your complexion and build perfectly. The navy suit would look absolutely stunning on you!");
        setCurrentStep('preferences');
      }, 2000);
    }
  };

  // Goal extraction handler
  const handleGoalExtracted = (goals) => {
    console.log('🎯 Goals extracted:', goals);
    setExtractedGoals(goals);
    
    // Update context with extracted information
    updateContext({
      goal: goals.occasion || context.goal,
      occasion: goals.occasion || context.occasion,
      location: goals.location || context.location,
      relationship: goals.relationship || context.relationship,
      timeline: goals.timeline || context.timeline
    });
    
    // If we have high confidence goals and the conversation is progressing, show asset capture
    if (goals.confidence > 70 && conversation.length > 2) {
      setShowAssetCapture(true);
    }
  };

  // Asset capture handler
  const handleAssetCaptured = (assetType, imageData) => {
    console.log(`📸 Asset captured: ${assetType}`, imageData ? 'Image received' : 'Image removed');
    
    updateContext({
      assets: {
        ...context.assets,
        [`${assetType}Image`]: imageData
      }
    });

    if (imageData) {
      // Add confirmation message when asset is captured
      addMessage('ai', `Perfect! I've got your ${assetType} image. This will help me create the perfect styling recommendations for you! 💫`);
      
      // If we have all assets, move to styling phase and show analysis components
      const updatedAssets = {
        ...context.assets,
        [`${assetType}Image`]: imageData
      };
      
      const assetCount = Object.values(updatedAssets).filter(Boolean).length;
      if (assetCount >= 2) { // At least 2 out of 3 assets
        setTimeout(() => {
          addMessage('ai', "Amazing! With these assets, I can create the most personalized styling recommendations. Let me analyze everything... ✨");
          setCurrentStep('styling');
          setShowAnalysisComponents(true);
        }, 1500);
      }
    }
  };

  // Analysis completion handlers
  const handleClothingAnalysisComplete = (analysisData) => {
    console.log('👔 Clothing analysis complete:', analysisData);
    setClothingAnalysis(analysisData);
  };

  const handleLocationAnalysisComplete = (analysisData) => {
    console.log('📍 Location analysis complete:', analysisData);
    setLocationAnalysis(analysisData);
  };

  const handleBodyAnalysisComplete = (analysisData) => {
    console.log('👤 Body analysis complete:', analysisData);
    setBodyAnalysis(analysisData);
  };

  const handleVisualizationComplete = (visualizationData) => {
    console.log('🎨 Outfit visualization complete:', visualizationData);
    setOutfitVisualization(visualizationData);
    
    // Add AI message about the visualization
    addMessage('ai', "Fantastic! I've created your perfect outfit visualization. Take a look at how amazing you'll look! ✨");
  };

  const handleAccessoryRecommendationsComplete = (recommendationsData) => {
    console.log('⌚ Accessory recommendations complete:', recommendationsData);
    setAccessoryRecommendations(recommendationsData);
  };

  const clearContext = () => {
    // Reset all state to initial values
    setContext({
      goal: '',
      occasion: '',
      location: '',
      relationship: '',
      timeline: '',
      assets: {
        closetImage: null,
        bodyImage: null,
        venueImage: null,
        preferences: {}
      },
      shoppingPreferences: '',
      budget: '',
      specialRequests: '',
      shoppingNeeds: ''
    });
    
    setCurrentStep('wake_word');
    setConversation([]);
    setIsProcessing(false);
    setIsListening(false);
    setCurrentTranscript('');
    setTextInput('');
    setGeneratedPrompt('');
    setShowPrompt(false);
    setWaitingForAIResponse(false);
    setAiResponseInput('');
    setCurrentEmotion(null);
    setEmotionHistory([]);
    setSessionInfo(null);
    setShowTextChat(false);
    setExtractedGoals(null);
    setShowAssetCapture(false);
    setClothingAnalysis(null);
    setLocationAnalysis(null);
    setBodyAnalysis(null);
    setOutfitVisualization(null);
    setAccessoryRecommendations(null);
    setShowAnalysisComponents(false);
    
    // Clear persisted context
    if (contextPersistence) {
      ContextService.clearContext();
      setSessionInfo(ContextService.getContextSummary());
    }
    
    console.log('🧹 Context cleared and reset to initial state');
  };

  return (
    <>
      {/* Wake Word Detector */}
      {showWakeDetector && (
        <WakeWordDetector
          onWakeWord={handleWakeWord}
          onSpeechRecognized={handleSpeechInput}
          isActive={currentStep === 'wake_word'}
        />
      )}

      <div className="glass-morphism p-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Mandy</h2>
            <p className="text-sm text-gray-400">Your AI Style Consultant</p>
          </div>
          <div className="ml-auto flex gap-2">
            {isDemo && (
              <span className="text-sm text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded">
                Demo Mode
              </span>
            )}
            {developmentMode && (
              <span className="text-sm text-green-400 bg-green-400/20 px-2 py-1 rounded">
                Development Mode
              </span>
            )}
            {useActualAPI && (
              <span className="text-sm text-blue-400 bg-blue-400/20 px-2 py-1 rounded">
                🤖 Live API
              </span>
            )}
            {contextPersistence && sessionInfo && (
              <span className="text-sm text-purple-400 bg-purple-400/20 px-2 py-1 rounded">
                💾 Session: {sessionInfo.sessionId.slice(-6)}
              </span>
            )}
          </div>
        </div>

      {/* Context Progress */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {['Goal', 'Occasion', 'Location', 'Assets', 'Ready'].map((step, index) => (
          <div
            key={step}
            className={`text-center p-2 rounded-lg text-xs transition-all ${
              index <= ['greeting', 'relationship', 'location', 'assets', 'body_analysis'].indexOf(currentStep)
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-gray-700/50 text-gray-500'
            }`}
          >
            {step}
          </div>
        ))}
      </div>

      {/* Context Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-pink-400" />
            <span className="text-xs font-semibold text-gray-300">Occasion</span>
          </div>
          <p className="text-xs text-white">{context.goal || 'Not specified'}</p>
          <p className="text-xs text-gray-400">{context.location || 'Location TBD'}</p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Camera className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-gray-300">Visual Assets</span>
          </div>
          <p className="text-xs text-white">
            {context.assets.closetImage ? 'Closet ✓' : 'Closet ⏳'}<br/>
            {context.assets.bodyImage ? 'Body ✓' : 'Body ⏳'}<br/>
            {context.assets.venueImage ? 'Venue ✓' : 'Venue ⏳'}
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-green-400" />
            <span className="text-xs font-semibold text-gray-300">Shopping</span>
          </div>
          <p className="text-xs text-white">{context.shoppingPreferences || 'TBD'}</p>
          <p className="text-xs text-gray-400">{context.budget || 'Budget flexible'}</p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-gray-300">Requests</span>
          </div>
          <p className="text-xs text-white">{context.specialRequests || 'None yet'}</p>
        </div>
      </div>

      {/* Emotion Detection Toggle */}
      <div className="flex justify-center mb-4">
        <button
          onClick={toggleEmotionDetector}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
            showEmotionDetector
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          {showEmotionDetector ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showEmotionDetector ? 'Hide Emotion Detection' : 'Show Emotion Detection'}
        </button>
      </div>

      {/* Current Emotion Display */}
      {currentEmotion && (
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-purple-300">Emotion Detected:</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {{
                happy: '😊',
                sad: '😢',
                angry: '😠',
                fearful: '😨',
                disgusted: '🤢',
                surprised: '😮',
                neutral: '😐'
              }[currentEmotion.emotion]}
            </span>
            <div>
              <p className="text-white font-semibold capitalize">{currentEmotion.emotion}</p>
              <p className="text-sm text-gray-300">{(currentEmotion.confidence * 100).toFixed(1)}% confidence</p>
            </div>
          </div>
        </div>
      )}

      {/* Generated Prompt Display */}
      {showPrompt && (
        <div className="mb-4">
          <div className="bg-blue-800/50 rounded-lg p-4 border border-blue-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-300">Generated Prompt for AI:</span>
              </div>
              <button
                onClick={copyPromptToClipboard}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs font-semibold transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="bg-gray-900/50 rounded p-3 mb-3 max-h-40 overflow-y-auto">
              <pre className="text-xs text-gray-200 whitespace-pre-wrap">{generatedPrompt}</pre>
            </div>
            <p className="text-xs text-blue-300">
              1. Copy this prompt 2. Paste into Gemini/ChatGPT 3. Copy the AI response 4. Paste below
            </p>
          </div>
        </div>
      )}

      {/* AI Response Input */}
      {waitingForAIResponse && (
        <form onSubmit={handleAIResponseSubmit} className="mb-4">
          <div className="bg-green-800/50 rounded-lg p-4 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-green-300">Paste AI Response (as Mandy):</span>
            </div>
            <div className="flex gap-3">
              <textarea
                value={aiResponseInput}
                onChange={(e) => setAiResponseInput(e.target.value)}
                placeholder="Paste Mandy's AI-generated response here..."
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none min-h-20 resize-y"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!aiResponseInput.trim() || isProcessing}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Add Response
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Development Mode Text Input */}
      {developmentMode && currentStep !== 'wake_word' && !waitingForAIResponse && (
        <form onSubmit={handleTextSubmit} className="mb-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-300">Development Mode - Type your response:</span>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your message to Mandy..."
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!textInput.trim() || isProcessing}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Speech Controls (hidden in dev mode) */}
      {!developmentMode && !showWakeDetector && (
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={startListening}
            disabled={isListening}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              isListening
                ? 'bg-green-600 animate-pulse cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <Mic className="w-5 h-5" />
            {isListening ? 'Listening...' : 'Start Speaking'}
          </button>
          
          <button
            onClick={stopListening}
            disabled={!isListening}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <MicOff className="w-5 h-5" />
            Stop
          </button>

          {/* Text Chat Toggle */}
          <button
            onClick={() => setShowTextChat(!showTextChat)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              showTextChat
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Text Chat
          </button>
          
          {/* Clear Context Button */}
          <button
            onClick={clearContext}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition-all"
            title="Clear all conversation and context data"
          >
            <Trash2 className="w-4 h-4" />
            Clear Context
          </button>
        </div>
      )}

      {/* Text Chat Interface (hidden by default) */}
      {showTextChat && !developmentMode && (
        <div className="mb-4">
          <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <span className="text-lg font-semibold text-blue-300">Chat with Mandy</span>
              </div>
              <button
                onClick={() => setShowTextChat(false)}
                className="text-gray-400 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleTextSubmit}>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your message to Mandy..."
                  className="flex-1 bg-gray-700/50 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  disabled={isProcessing}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() || isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      Send
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-3 text-xs text-blue-300/70">
              💡 Use this when voice recognition isn't working properly
            </div>
          </div>
        </div>
      )}

      {/* Current Speech Display (hidden in dev mode) */}
      {!developmentMode && currentTranscript && (
        <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-sm font-semibold text-blue-300">You're saying:</span>
          </div>
          <p className="text-white italic">"{currentTranscript}"</p>
        </div>
      )}

      {/* Conversation Area */}
      <div className="bg-gray-900/50 rounded-lg p-4 h-64 overflow-y-auto mb-4">
        {conversation.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block max-w-xs px-4 py-3 rounded-2xl ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              {message.emotion && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs">
                    {{
                      happy: '😊',
                      sad: '😢',
                      angry: '😠',
                      fearful: '😨',
                      disgusted: '🤢',
                      surprised: '😮',
                      neutral: '😐'
                    }[message.emotion]}
                  </span>
                  <span className="text-xs opacity-70">
                    {message.emotion}
                    {message.emotionData && ` (${(message.emotionData.confidence * 100).toFixed(1)}%)`}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="text-left mb-4">
            <div className="inline-block bg-gray-700 text-gray-100 px-4 py-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm">Mandy is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Goal Extraction Component */}
      {conversation.length > 0 && (
        <div className="mb-4">
          <GoalExtractor 
            conversation={conversation}
            onGoalExtracted={handleGoalExtracted}
            currentContext={context}
          />
        </div>
      )}

      {/* Asset Capture Component */}
      {showAssetCapture && (
        <div className="mb-4">
          <AssetCapture 
            onAssetCaptured={handleAssetCaptured}
            context={context}
          />
        </div>
      )}

      {/* Image Capture Panel */}
      {showImageCapture && (
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold text-white mb-3">Share Your Assets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleImageUpload('demo-closet-data', 'closet')}
              className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition-colors"
            >
              <Camera className="w-6 h-6 text-purple-400" />
              <div className="text-left">
                <p className="font-semibold text-white">Take Closet Photo</p>
                <p className="text-sm text-gray-400">Show me your wardrobe</p>
              </div>
            </button>
            
            <button
              onClick={() => handleImageUpload('demo-upload-data', 'closet')}
              className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition-colors"
            >
              <Upload className="w-6 h-6 text-pink-400" />
              <div className="text-left">
                <p className="font-semibold text-white">Upload Image</p>
                <p className="text-sm text-gray-400">From your gallery</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center">
        <p className="text-sm text-gray-400 mb-2">
          {developmentMode && currentStep === 'greeting' && "Type: Tell Mandy about your styling challenge"}
          {developmentMode && currentStep === 'relationship' && "Type: Correct any assumptions about your relationship"}
          {developmentMode && currentStep === 'location' && "Type: Share where you're going"}
          {developmentMode && currentStep === 'assets' && "Type: Your preferences while image capture is simulated"}
          {developmentMode && currentStep === 'body_analysis' && "Type: Your style preferences"}
          {!developmentMode && currentStep === 'greeting' && "Tell Mandy about your styling challenge"}
          {!developmentMode && currentStep === 'relationship' && "Correct any assumptions about your relationship"}
          {!developmentMode && currentStep === 'location' && "Share where you're going"}
          {!developmentMode && currentStep === 'assets' && "Upload your closet image when ready"}
          {!developmentMode && currentStep === 'body_analysis' && "Share your style preferences"}
        </p>
        
        {developmentMode && (
          <div className="mt-3 p-3 bg-green-600/20 border border-green-500/30 rounded-lg">
            <p className="text-xs text-green-300 text-center">
              🧪 Development Mode: 1) Type message → 2) Copy generated prompt → 3) Paste into Gemini → 4) Paste AI response back
            </p>
          </div>
        )}
      </div>
      </div>

      {/* Inline Emotion Detection */}
      {showEmotionDetector && (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-purple-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Emotion Detection</h3>
            </div>
            <button
              onClick={toggleEmotionDetector}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
          <div className="max-w-2xl mx-auto">
            <EmotionDetector
              onEmotionDetected={handleEmotionDetected}
              isActive={showEmotionDetector}
              showUI={true}
            />
          </div>
        </div>
      )}

      {/* Analysis Components */}
      {showAnalysisComponents && (
        <div className="space-y-6">
          {/* Analysis Header */}
          <div className="text-center py-4">
            <h2 className="text-2xl font-bold text-white mb-2">✨ Creating Your Perfect Look</h2>
            <p className="text-gray-300">Let me analyze all your assets to create personalized recommendations</p>
          </div>

          {/* Clothing Analysis */}
          {context.assets.closetImage && (
            <ClothingAnalyzer
              closetImage={context.assets.closetImage}
              onAnalysisComplete={handleClothingAnalysisComplete}
            />
          )}

          {/* Location Analysis */}
          {context.location && (
            <LocationAnalyzer
              location={context.location}
              venueImage={context.assets.venueImage}
              occasion={context.goal}
              onLocationAnalysisComplete={handleLocationAnalysisComplete}
            />
          )}

          {/* Body Analysis */}
          {context.assets.bodyImage && (
            <BodyAnalyzer
              bodyImage={context.assets.bodyImage}
              occasion={context.goal}
              onBodyAnalysisComplete={handleBodyAnalysisComplete}
            />
          )}

          {/* Outfit Visualizer */}
          {(clothingAnalysis || bodyAnalysis) && (
            <OutfitVisualizer
              context={context}
              clothingAnalysis={clothingAnalysis}
              locationAnalysis={locationAnalysis}
              bodyAnalysis={bodyAnalysis}
              onVisualizationComplete={handleVisualizationComplete}
            />
          )}

          {/* Accessory Recommendations */}
          {bodyAnalysis && (
            <ErrorBoundary>
              <AccessoryRecommendations
                context={context}
                clothingAnalysis={clothingAnalysis}
                bodyAnalysis={bodyAnalysis}
                locationAnalysis={locationAnalysis}
                onAccessoryRecommendations={handleAccessoryRecommendationsComplete}
              />
            </ErrorBoundary>
          )}

          {/* Final Styling Complete Message */}
          {outfitVisualization && accessoryRecommendations && (
            <div className="text-center py-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-white mb-2">Your Perfect Look is Ready!</h3>
              <p className="text-gray-300">
                I've created a complete styling recommendation tailored just for you. 
                You're going to look absolutely incredible at {context.location}!
              </p>
              <button
                onClick={() => onContextGathered?.(context)}
                className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-lg font-semibold transition-all"
              >
                See My Complete Style Board ✨
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ConversationManager;