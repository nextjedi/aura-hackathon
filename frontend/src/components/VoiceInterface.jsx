import { useState, useEffect } from 'react';
import { MessageCircle, Send, Mic, Volume2, Loader2 } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

const VoiceInterface = ({ selectedClothing, onImageGenerated, isDemo }) => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationPhase, setConversationPhase] = useState('greeting'); // greeting, occasion, preferences, generating
  const [occasion, setOccasion] = useState('');
  const [preferences, setPreferences] = useState({});

  // Demo script for perfect flow
  const demoScript = {
    greeting: "Hello! I love that " + (selectedClothing?.color || 'beautiful') + " " + (selectedClothing?.type || 'piece') + "! What's the occasion you're dressing for?",
    occasion_response: "Perfect! I can create an amazing style for that. Let me generate your personalized style board...",
    final: "Here's your perfect style! I've created a look that's absolutely stunning for your occasion."
  };

  useEffect(() => {
    // Start conversation
    if (messages.length === 0) {
      const greeting = isDemo 
        ? demoScript.greeting
        : `Hi! I see you've selected a ${selectedClothing?.color || ''} ${selectedClothing?.type || 'item'}. What's the occasion you're dressing for?`;
      
      addMessage('aura', greeting);
    }
  }, [selectedClothing, isDemo]);

  const addMessage = (sender, content, data = null) => {
    const message = {
      id: Date.now(),
      sender, // 'user' or 'aura'
      content,
      data,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    addMessage('user', userMessage);
    
    if (isDemo) {
      // Demo mode - scripted responses
      setIsLoading(true);
      setTimeout(() => {
        if (conversationPhase === 'greeting') {
          setOccasion(userMessage);
          addMessage('aura', demoScript.occasion_response);
          setConversationPhase('generating');
          
          // Simulate generation
          setTimeout(() => {
            onImageGenerated({
              imageUrl: '/demo-assets/style-demo.jpg',
              description: 'Perfect business casual look',
              accessories: ['Silver watch', 'Leather briefcase', 'Oxford shoes'],
              notes: ['Great for client meetings', 'Professional yet approachable', 'Color coordination is on point']
            });
          }, 2000);
        }
        setIsLoading(false);
      }, 1000);
      return;
    }

    // Real conversation flow
    setIsLoading(true);
    try {
      if (conversationPhase === 'greeting') {
        // User provided occasion
        setOccasion(userMessage);
        setConversationPhase('preferences');
        
        const response = await GeminiService.getChatResponse(
          `The user wants to dress for: ${userMessage}. Ask about their style preferences or any specific requirements.`,
          { clothing: selectedClothing, occasion: userMessage }
        );
        
        addMessage('aura', response.response);
        
      } else if (conversationPhase === 'preferences') {
        // Collect preferences and generate style
        const newPreferences = { ...preferences, additional: userMessage };
        setPreferences(newPreferences);
        setConversationPhase('generating');
        
        addMessage('aura', "Perfect! Let me create your personalized style board...");
        
        // Generate style board
        try {
          const styleResult = await GeminiService.generateStyleBoard(
            null, // userPhoto - would be from camera
            selectedClothing,
            occasion,
            newPreferences
          );
          
          onImageGenerated(styleResult.styleBoard);
        } catch (styleError) {
          console.error('Style generation failed:', styleError);
          addMessage('aura', "I'm having trouble generating your style right now, but based on your preferences, I'd recommend...");
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage('aura', "Sorry, I'm having trouble right now. Let me try again...");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="glass-morphism p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-semibold">Style Consultation</h2>
        {isDemo && (
          <span className="ml-auto text-sm text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded">
            Demo Mode
          </span>
        )}
      </div>

      {/* Selected Clothing Display */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Detected Clothing:</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
            {selectedClothing?.type || 'Item'}
          </span>
          <span className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded">
            {selectedClothing?.color || 'Color'}
          </span>
          <span className="bg-green-600/20 text-green-300 px-2 py-1 rounded">
            {selectedClothing?.style || 'Style'}
          </span>
        </div>
      </div>

      {/* Conversation Area */}
      <div className="bg-gray-900/50 rounded-lg p-4 h-64 overflow-y-auto mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-3 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block max-w-xs px-3 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="text-left mb-3">
            <div className="inline-block bg-gray-700 text-gray-100 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AURA is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={conversationPhase === 'generating' ? "Style is being generated..." : "Type your response..."}
          disabled={isLoading || conversationPhase === 'generating'}
          className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !currentMessage.trim() || conversationPhase === 'generating'}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              {!isDemo && <span className="text-xs">Text</span>}
            </>
          )}
        </button>
      </div>

      {/* Phase 3 Features - Coming Soon */}
      <div className="mt-4 flex justify-center gap-4">
        <button
          disabled
          className="flex items-center gap-2 text-gray-400 bg-gray-800/50 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed"
        >
          <Mic className="w-4 h-4" />
          <span className="text-xs">Voice (Phase 3)</span>
        </button>
        <button
          disabled
          className="flex items-center gap-2 text-gray-400 bg-gray-800/50 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed"
        >
          <Volume2 className="w-4 h-4" />
          <span className="text-xs">Audio (Phase 3)</span>
        </button>
      </div>

      {isDemo && conversationPhase === 'greeting' && (
        <div className="mt-4 p-3 bg-yellow-600/20 rounded-lg">
          <p className="text-yellow-300 text-sm">
            💡 Demo tip: Try typing "business meeting" or "casual dinner" to see the AI respond!
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceInterface;