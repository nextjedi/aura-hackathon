import React, { useState, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';

const AccessoryRecommendations = ({ 
  context, 
  clothingAnalysis, 
  bodyAnalysis, 
  locationAnalysis,
  onAccessoryRecommendations 
}) => {
  const [recommendations, setRecommendations] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState(null);

  const generateAccessoryRecommendations = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const prompt = createAccessoryPrompt();
      const response = await GeminiService.getMandyResponse(prompt, 'TEXT_ONLY');
      
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const accessoryData = JSON.parse(jsonMatch[0]);
        setRecommendations(accessoryData);
        onAccessoryRecommendations(accessoryData);
      } else {
        // Fallback recommendations
        const fallbackRecs = createFallbackRecommendations();
        setRecommendations(fallbackRecs);
        onAccessoryRecommendations(fallbackRecs);
      }
    } catch (error) {
      console.error('Accessory recommendation error:', error);
      setError('Failed to generate recommendations. Using defaults.');
      
      const fallbackRecs = createFallbackRecommendations();
      setRecommendations(fallbackRecs);
      onAccessoryRecommendations(fallbackRecs);
    } finally {
      setIsGenerating(false);
    }
  };

  const createAccessoryPrompt = () => {
    const occasion = context?.goal || 'business meeting';
    const location = context?.location || 'office';
    const formality = locationAnalysis?.formality_level || 'high';
    const bodyType = bodyAnalysis?.body_analysis?.body_type || 'average';
    const suitColor = bodyAnalysis?.color_recommendations?.best_colors?.[0] || 'navy';
    
    return `Create comprehensive accessory recommendations for ${occasion} at ${location}. 

CONTEXT:
- Occasion: ${occasion}
- Location: ${location} 
- Formality Level: ${formality}
- Body Type: ${bodyType}
- Primary Suit Color: ${suitColor}
- Relationship Context: ${context?.relationship || 'professional'}

Provide detailed recommendations in JSON format:
{
  "ties": [
    {
      "style": "silk solid tie",
      "color": "burgundy",
      "pattern": "solid",
      "width": "3.5 inches",
      "occasion_match": 95,
      "styling_note": "Perfect power tie for important meetings",
      "where_to_buy": "high-end menswear store"
    }
  ],
  "pocket_squares": [
    {
      "fabric": "white linen",
      "fold": "presidential fold",
      "color": "white",
      "occasion_match": 90,
      "styling_note": "Classic and sophisticated"
    }
  ],
  "watches": [
    {
      "type": "dress watch",
      "style": "minimalist",
      "strap": "black leather",
      "face": "white",
      "brand_style": "premium classic",
      "occasion_match": 95,
      "styling_note": "Elegant timepiece for formal occasions"
    }
  ],
  "shoes": [
    {
      "style": "oxford",
      "color": "black",
      "leather": "patent leather",
      "toe": "cap toe",
      "occasion_match": 95,
      "styling_note": "Classic formal shoe, highly polished"
    }
  ],
  "belts": [
    {
      "width": "1.25 inches",
      "color": "black",
      "buckle": "simple silver",
      "leather": "full grain",
      "occasion_match": 90,
      "styling_note": "Should match shoe color exactly"
    }
  ],
  "cufflinks": [
    {
      "style": "classic round",
      "material": "silver",
      "design": "simple",
      "occasion_match": 85,
      "styling_note": "For French cuff shirts only"
    }
  ],
  "socks": [
    {
      "color": "navy",
      "pattern": "solid",
      "material": "wool",
      "length": "over the calf",
      "occasion_match": 90,
      "styling_note": "Should match trouser color"
    }
  ],
  "styling_combinations": [
    {
      "name": "Power Professional",
      "items": ["burgundy silk tie", "white linen pocket square", "black oxford shoes", "silver dress watch"],
      "description": "Maximum authority and professionalism",
      "confidence_boost": 95
    }
  ],
  "budget_options": {
    "low": "Essential accessories for under $200",
    "medium": "Quality accessories for $200-500", 
    "high": "Premium accessories for $500+"
  },
  "seasonal_adjustments": "Recommendations for current season/weather",
  "cultural_considerations": "Any cultural or regional preferences"
}

Be specific about brands, quality levels, and exact styling details.`;
  };

  const createFallbackRecommendations = () => {
    return {
      ties: [
        {
          style: "silk solid tie",
          color: "burgundy",
          pattern: "solid",
          width: "3.5 inches",
          occasion_match: 95,
          styling_note: "Perfect power tie for important meetings",
          where_to_buy: "high-end menswear store"
        },
        {
          style: "silk striped tie",
          color: "navy with silver stripes",
          pattern: "diagonal stripes",
          width: "3.5 inches",
          occasion_match: 90,
          styling_note: "Classic business tie with subtle pattern"
        }
      ],
      pocket_squares: [
        {
          fabric: "white linen",
          fold: "presidential fold",
          color: "white",
          occasion_match: 95,
          styling_note: "Classic and always appropriate"
        }
      ],
      watches: [
        {
          type: "dress watch",
          style: "minimalist",
          strap: "black leather",
          face: "white",
          brand_style: "premium classic",
          occasion_match: 95,
          styling_note: "Elegant timepiece for formal occasions"
        }
      ],
      shoes: [
        {
          style: "oxford",
          color: "black",
          leather: "patent leather",
          toe: "cap toe",
          occasion_match: 95,
          styling_note: "Classic formal shoe, highly polished"
        }
      ],
      belts: [
        {
          width: "1.25 inches",
          color: "black",
          buckle: "simple silver",
          leather: "full grain",
          occasion_match: 90,
          styling_note: "Should match shoe color exactly"
        }
      ],
      socks: [
        {
          color: "navy",
          pattern: "solid",
          material: "wool",
          length: "over the calf",
          occasion_match: 90,
          styling_note: "Should complement suit color"
        }
      ],
      styling_combinations: [
        {
          name: "Power Professional",
          items: ["burgundy silk tie", "white linen pocket square", "black oxford shoes", "silver dress watch"],
          description: "Maximum authority and professionalism",
          confidence_boost: 95
        },
        {
          name: "Refined Classic",
          items: ["navy striped tie", "white pocket square", "black oxfords", "dress watch"],
          description: "Timeless elegance and sophistication",
          confidence_boost: 90
        }
      ],
      budget_options: {
        low: "Essential accessories for under $200",
        medium: "Quality accessories for $200-500", 
        high: "Premium accessories for $500+"
      }
    };
  };

  const getMatchColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getMatchIcon = (score) => {
    if (score >= 90) return '🎯';
    if (score >= 80) return '✅';
    return '⚡';
  };

  // Auto-generate when context is available
  useEffect(() => {
    if (context && context.goal && !recommendations && !isGenerating) {
      generateAccessoryRecommendations();
    }
  }, [context?.goal, bodyAnalysis, locationAnalysis, recommendations, isGenerating]);

  const categories = [
    { key: 'all', name: 'All Accessories', icon: '👔' },
    { key: 'ties', name: 'Ties', icon: '👔' },
    { key: 'watches', name: 'Watches', icon: '⌚' },
    { key: 'shoes', name: 'Shoes', icon: '👞' },
    { key: 'pocket_squares', name: 'Pocket Squares', icon: '🤍' },
    { key: 'belts', name: 'Belts', icon: '📿' },
    { key: 'styling_combinations', name: 'Complete Looks', icon: '✨' }
  ];

  return (
    <div className="accessory-recommendations p-4 glass-morphism rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          ⌚ Perfect Accessories
        </h3>
        <button
          onClick={generateAccessoryRecommendations}
          disabled={isGenerating}
          className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:bg-gray-500"
        >
          {isGenerating ? 'Generating...' : 'Refresh Recommendations'}
        </button>
      </div>

      {/* Category Filter */}
      <div className="category-filter mb-4">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedCategory === category.key
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

      {isGenerating && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-300">Curating perfect accessories for your style...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {recommendations && (
        <div className="recommendations-content space-y-4">
          {/* Ties */}
          {(selectedCategory === 'all' || selectedCategory === 'ties') && recommendations.ties && (
            <div className="ties-section">
              <h4 className="text-md font-semibold text-white mb-3 flex items-center">
                👔 Ties
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendations.ties.map((tie, index) => (
                  <div key={index} className="tie-item bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{tie.style}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getMatchIcon(tie.occasion_match)}</span>
                        <span className={`text-sm font-medium ${getMatchColor(tie.occasion_match)}`}>
                          {tie.occasion_match}%
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-300 space-y-1">
                      <div><span className="text-gray-500">Color:</span> {tie.color}</div>
                      <div><span className="text-gray-500">Pattern:</span> {tie.pattern}</div>
                      <div><span className="text-gray-500">Width:</span> {tie.width}</div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 italic">"{tie.styling_note}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Watches */}
          {(selectedCategory === 'all' || selectedCategory === 'watches') && recommendations.watches && (
            <div className="watches-section">
              <h4 className="text-md font-semibold text-white mb-3 flex items-center">
                ⌚ Watches
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendations.watches.map((watch, index) => (
                  <div key={index} className="watch-item bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{watch.type}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getMatchIcon(watch.occasion_match)}</span>
                        <span className={`text-sm font-medium ${getMatchColor(watch.occasion_match)}`}>
                          {watch.occasion_match}%
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-300 space-y-1">
                      <div><span className="text-gray-500">Style:</span> {watch.style}</div>
                      <div><span className="text-gray-500">Strap:</span> {watch.strap}</div>
                      <div><span className="text-gray-500">Face:</span> {watch.face}</div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 italic">"{watch.styling_note}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shoes */}
          {(selectedCategory === 'all' || selectedCategory === 'shoes') && recommendations.shoes && (
            <div className="shoes-section">
              <h4 className="text-md font-semibold text-white mb-3 flex items-center">
                👞 Shoes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendations.shoes.map((shoe, index) => (
                  <div key={index} className="shoe-item bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium capitalize">{shoe.style}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getMatchIcon(shoe.occasion_match)}</span>
                        <span className={`text-sm font-medium ${getMatchColor(shoe.occasion_match)}`}>
                          {shoe.occasion_match}%
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-300 space-y-1">
                      <div><span className="text-gray-500">Color:</span> {shoe.color}</div>
                      <div><span className="text-gray-500">Leather:</span> {shoe.leather}</div>
                      <div><span className="text-gray-500">Toe:</span> {shoe.toe}</div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 italic">"{shoe.styling_note}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete Styling Combinations */}
          {(selectedCategory === 'all' || selectedCategory === 'styling_combinations') && recommendations.styling_combinations && (
            <div className="combinations-section">
              <h4 className="text-md font-semibold text-white mb-3 flex items-center">
                ✨ Complete Looks
              </h4>
              <div className="space-y-3">
                {recommendations.styling_combinations.map((combo, index) => (
                  <div key={index} className="combo-item bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-white font-semibold">{combo.name}</h5>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">🔥</span>
                        <span className="text-green-400 font-medium">{combo.confidence_boost}% confidence</span>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm mb-3">{combo.description}</p>
                    <div className="items-list">
                      <span className="text-gray-400 text-xs">Includes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {combo.items.map((item, itemIndex) => (
                          <span key={itemIndex} className="inline-block bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budget Guidelines */}
          {recommendations.budget_options && (
            <div className="budget-section bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <h4 className="text-md font-semibold text-green-300 mb-3">💰 Budget Guidelines</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-green-400">Essential ($200-):</span>
                  <span className="text-gray-300">{recommendations.budget_options.low}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400">Quality ($200-500):</span>
                  <span className="text-gray-300">{recommendations.budget_options.medium}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-400">Premium ($500+):</span>
                  <span className="text-gray-300">{recommendations.budget_options.high}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!recommendations && !isGenerating && (
        <div className="text-center text-gray-400 py-8">
          <div className="text-6xl mb-4">⌚</div>
          <p>Complete your styling profile to get personalized accessory recommendations</p>
        </div>
      )}
    </div>
  );
};

export default AccessoryRecommendations;