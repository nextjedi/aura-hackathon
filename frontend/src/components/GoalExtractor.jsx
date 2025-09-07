import React, { useState, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';

const GoalExtractor = ({ conversation, onGoalExtracted, currentContext }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedGoals, setExtractedGoals] = useState(null);
  const [confidence, setConfidence] = useState(0);

  // Goal categories to identify
  const goalCategories = {
    occasion: {
      keywords: ['wedding', 'date', 'interview', 'party', 'work', 'casual', 'formal', 'business', 'event', 'dinner', 'meeting', 'celebration'],
      weight: 0.4,
      examples: ['wedding', 'job interview', 'first date', 'business meeting', 'casual hangout']
    },
    relationship: {
      keywords: ['wife', 'girlfriend', 'partner', 'spouse', 'husband', 'date', 'boss', 'colleagues', 'friends', 'family'],
      weight: 0.3,
      examples: ['impressing wife', 'meeting girlfriend\'s parents', 'important client meeting']
    },
    style: {
      keywords: ['professional', 'casual', 'formal', 'trendy', 'classic', 'modern', 'elegant', 'comfortable', 'sharp', 'stylish'],
      weight: 0.2,
      examples: ['look professional', 'casual but stylish', 'formal and elegant']
    },
    timeline: {
      keywords: ['today', 'tomorrow', 'tonight', 'weekend', 'next week', 'urgent', 'soon', 'later', 'morning', 'evening'],
      weight: 0.1,
      examples: ['tonight\'s dinner', 'this weekend', 'tomorrow morning meeting']
    }
  };

  const extractGoalsFromConversation = async () => {
    if (!conversation || conversation.length === 0) return;

    setIsAnalyzing(true);

    try {
      // Simple keyword-based extraction first
      const simpleExtraction = performKeywordExtraction();
      
      // Then enhance with AI analysis
      const aiExtraction = await performAIExtraction();
      
      const combinedGoals = {
        ...simpleExtraction,
        ...aiExtraction,
        confidence: Math.min((simpleExtraction.confidence + aiExtraction.confidence) / 2, 100)
      };

      setExtractedGoals(combinedGoals);
      setConfidence(combinedGoals.confidence);
      onGoalExtracted(combinedGoals);
      
    } catch (error) {
      console.error('Goal extraction error:', error);
      // Fallback to keyword-only extraction
      const fallbackGoals = performKeywordExtraction();
      setExtractedGoals(fallbackGoals);
      onGoalExtracted(fallbackGoals);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const performKeywordExtraction = () => {
    const allText = conversation
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.content.toLowerCase())
      .join(' ');

    let totalScore = 0;
    let detectedGoals = {
      occasion: '',
      relationship: '',
      style: '',
      timeline: '',
      location: currentContext.location || '',
      priority: 'medium'
    };

    // Analyze each category
    Object.entries(goalCategories).forEach(([category, config]) => {
      let categoryScore = 0;
      let bestMatch = '';
      
      config.keywords.forEach(keyword => {
        if (allText.includes(keyword)) {
          categoryScore += config.weight;
          if (!bestMatch || keyword.length > bestMatch.length) {
            bestMatch = keyword;
          }
        }
      });
      
      if (bestMatch) {
        detectedGoals[category] = bestMatch;
        totalScore += categoryScore;
      }
    });

    // Determine priority based on timeline keywords
    if (allText.includes('urgent') || allText.includes('tonight') || allText.includes('today')) {
      detectedGoals.priority = 'high';
    } else if (allText.includes('next week') || allText.includes('later')) {
      detectedGoals.priority = 'low';
    }

    return {
      ...detectedGoals,
      confidence: Math.min(totalScore * 100, 85), // Cap at 85% for keyword-only
      method: 'keyword'
    };
  };

  const performAIExtraction = async () => {
    const conversationText = conversation
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');

    const prompt = `Analyze this conversation and extract styling goals in JSON format:

CONVERSATION:
${conversationText}

Extract these key elements:
1. occasion - What event/situation (wedding, interview, date, etc.)
2. relationship - Who they're dressing for (wife, boss, date, etc.)  
3. style - Desired aesthetic (professional, casual, formal, etc.)
4. timeline - When they need this (today, tonight, weekend, etc.)
5. location - Where they're going
6. priority - How urgent (high, medium, low)
7. emotional_context - How they're feeling about this

Return ONLY a JSON object with these fields. Be specific and confident based on the conversation context.

Example:
{
  "occasion": "wedding reception", 
  "relationship": "wife",
  "style": "formal elegant",
  "timeline": "this weekend",
  "location": "Taj Palace Hotel",
  "priority": "high",
  "emotional_context": "excited but nervous"
}`;

    try {
      const response = await GeminiService.getMandyResponse(prompt, 'TEXT_ONLY');
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        return {
          ...extracted,
          confidence: 95, // Higher confidence for AI extraction
          method: 'ai'
        };
      }
    } catch (error) {
      console.error('AI extraction failed:', error);
    }

    return {
      confidence: 0,
      method: 'ai_failed'
    };
  };

  // Auto-trigger analysis when conversation changes
  useEffect(() => {
    if (conversation && conversation.length > 0) {
      const timer = setTimeout(extractGoalsFromConversation, 1000);
      return () => clearTimeout(timer);
    }
  }, [conversation]);

  if (!extractedGoals && !isAnalyzing) {
    return null;
  }

  return (
    <div className="goal-extractor p-4 glass-morphism rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          🎯 Style Goals Detected
        </h3>
        <div className="flex items-center space-x-2">
          {isAnalyzing && (
            <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            confidence > 80 ? 'bg-green-500 text-white' :
            confidence > 60 ? 'bg-yellow-500 text-black' :
            'bg-gray-500 text-white'
          }`}>
            {confidence}% confidence
          </span>
        </div>
      </div>

      {extractedGoals && (
        <div className="goals-grid space-y-3">
          {extractedGoals.occasion && (
            <div className="goal-item flex items-center space-x-3">
              <span className="text-2xl">🎭</span>
              <div>
                <span className="text-sm text-gray-300">Occasion:</span>
                <span className="ml-2 text-white font-medium">{extractedGoals.occasion}</span>
              </div>
            </div>
          )}

          {extractedGoals.relationship && (
            <div className="goal-item flex items-center space-x-3">
              <span className="text-2xl">👥</span>
              <div>
                <span className="text-sm text-gray-300">For:</span>
                <span className="ml-2 text-white font-medium">{extractedGoals.relationship}</span>
              </div>
            </div>
          )}

          {extractedGoals.style && (
            <div className="goal-item flex items-center space-x-3">
              <span className="text-2xl">✨</span>
              <div>
                <span className="text-sm text-gray-300">Style:</span>
                <span className="ml-2 text-white font-medium">{extractedGoals.style}</span>
              </div>
            </div>
          )}

          {extractedGoals.timeline && (
            <div className="goal-item flex items-center space-x-3">
              <span className="text-2xl">⏰</span>
              <div>
                <span className="text-sm text-gray-300">When:</span>
                <span className="ml-2 text-white font-medium">{extractedGoals.timeline}</span>
              </div>
            </div>
          )}

          {extractedGoals.location && (
            <div className="goal-item flex items-center space-x-3">
              <span className="text-2xl">📍</span>
              <div>
                <span className="text-sm text-gray-300">Where:</span>
                <span className="ml-2 text-white font-medium">{extractedGoals.location}</span>
              </div>
            </div>
          )}

          {extractedGoals.emotional_context && (
            <div className="goal-item flex items-center space-x-3">
              <span className="text-2xl">💭</span>
              <div>
                <span className="text-sm text-gray-300">Feeling:</span>
                <span className="ml-2 text-white font-medium">{extractedGoals.emotional_context}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-600">
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            extractedGoals?.priority === 'high' ? 'bg-red-500 text-white' :
            extractedGoals?.priority === 'medium' ? 'bg-yellow-500 text-black' :
            'bg-green-500 text-white'
          }`}>
            {extractedGoals?.priority?.toUpperCase()} PRIORITY
          </span>
          <button
            onClick={extractGoalsFromConversation}
            className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalExtractor;