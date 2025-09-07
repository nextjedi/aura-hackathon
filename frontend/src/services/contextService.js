// Context Persistence Service for AURA Development
// Saves and loads conversation context to localStorage for development continuity

export class ContextService {
  static STORAGE_KEY = 'aura_conversation_context';
  static SESSION_KEY = 'aura_session_id';

  // Generate unique session ID
  static generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get or create current session ID
  static getCurrentSessionId() {
    let sessionId = localStorage.getItem(this.SESSION_KEY);
    if (!sessionId) {
      sessionId = this.generateSessionId();
      localStorage.setItem(this.SESSION_KEY, sessionId);
    }
    return sessionId;
  }

  // Save complete conversation context
  static saveContext(context, conversation, currentStep, emotions = []) {
    try {
      const sessionId = this.getCurrentSessionId();
      const contextData = {
        sessionId,
        timestamp: new Date().toISOString(),
        context,
        conversation: conversation.map(msg => ({
          ...msg,
          timestamp: msg.timestamp?.toISOString ? msg.timestamp.toISOString() : msg.timestamp
        })),
        currentStep,
        emotions,
        version: '1.0'
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(contextData));
      console.log('✅ Context saved for session:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('❌ Failed to save context:', error);
      return null;
    }
  }

  // Load conversation context
  static loadContext() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) {
        return this.getDefaultContext();
      }

      const contextData = JSON.parse(saved);
      
      // Convert timestamp strings back to Date objects
      contextData.conversation = contextData.conversation.map(msg => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
      }));

      console.log('✅ Context loaded for session:', contextData.sessionId);
      return contextData;
    } catch (error) {
      console.error('❌ Failed to load context:', error);
      return this.getDefaultContext();
    }
  }

  // Get default/empty context
  static getDefaultContext() {
    return {
      sessionId: this.getCurrentSessionId(),
      timestamp: new Date().toISOString(),
      context: {
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
      },
      conversation: [],
      currentStep: 'wake_word',
      emotions: [],
      version: '1.0'
    };
  }

  // Clear all saved context (start fresh)
  static clearContext() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.SESSION_KEY);
      console.log('🗑️ All context cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear context:', error);
      return false;
    }
  }

  // Export context for backup/analysis
  static exportContext() {
    const contextData = this.loadContext();
    const blob = new Blob([JSON.stringify(contextData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura_context_${contextData.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📁 Context exported');
  }

  // Import context from file
  static async importContext(file) {
    try {
      const text = await file.text();
      const contextData = JSON.parse(text);
      
      // Validate structure
      if (!contextData.context || !contextData.conversation) {
        throw new Error('Invalid context file structure');
      }

      localStorage.setItem(this.STORAGE_KEY, text);
      console.log('📂 Context imported for session:', contextData.sessionId);
      return contextData;
    } catch (error) {
      console.error('❌ Failed to import context:', error);
      return null;
    }
  }

  // Get context summary for display
  static getContextSummary() {
    const data = this.loadContext();
    const { context, conversation, currentStep } = data;
    
    return {
      sessionId: data.sessionId,
      lastUpdated: data.timestamp,
      currentStep,
      messageCount: conversation.length,
      hasClosetImage: !!context.assets.closetImage,
      hasBodyImage: !!context.assets.bodyImage,
      hasVenueImage: !!context.assets.venueImage,
      goal: context.goal,
      location: context.location,
      relationship: context.relationship
    };
  }

  // Auto-save with debouncing
  static autoSave = (() => {
    let timeout;
    return (context, conversation, currentStep, emotions) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.saveContext(context, conversation, currentStep, emotions);
      }, 1000); // Save after 1 second of inactivity
    };
  })();
}