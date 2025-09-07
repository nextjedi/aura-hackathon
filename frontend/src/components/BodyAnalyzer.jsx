import React, { useState, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';

const BodyAnalyzer = ({ bodyImage, occasion, onBodyAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [bodyAnalysis, setBodyAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const analyzeBodyType = async () => {
    if (!bodyImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const prompt = `Analyze this body type photo for personalized suit and clothing recommendations. Provide detailed analysis in JSON format:

{
  "body_analysis": {
    "body_type": "rectangle|inverted_triangle|triangle|oval|athletic|etc",
    "build": "slim|athletic|average|broad|etc",
    "height_estimate": "short|average|tall",
    "shoulder_width": "narrow|average|broad",
    "torso_shape": "straight|tapered|full",
    "proportions": "description of overall proportions"
  },
  "suit_recommendations": {
    "jacket_style": "single_breasted|double_breasted|specific_style",
    "jacket_fit": "slim|regular|relaxed",
    "lapel_style": "notched|peak|shawl",
    "button_count": "1|2|3",
    "shoulder_construction": "soft|structured|natural",
    "jacket_length": "short|regular|long",
    "jacket_suppression": "high|medium|low"
  },
  "trouser_recommendations": {
    "fit": "slim|straight|relaxed|tapered",
    "rise": "low|mid|high",
    "break": "no_break|slight_break|full_break",
    "pleats": "flat_front|single_pleat|double_pleat",
    "cuff": "no_cuff|cuffed"
  },
  "shirt_recommendations": {
    "fit": "slim|regular|relaxed",
    "collar": "spread|point|button_down|cutaway",
    "pattern": "solid|striped|checked|subtle_pattern"
  },
  "color_recommendations": {
    "best_colors": ["colors that complement skin tone and build"],
    "avoid_colors": ["colors to avoid"],
    "skin_tone": "warm|cool|neutral"
  },
  "styling_tips": [
    "specific tips to enhance this body type",
    "proportion balancing techniques",
    "what to emphasize or minimize"
  ],
  "accessory_recommendations": {
    "tie_width": "skinny|regular|wide",
    "pocket_square": "recommended styles",
    "belt": "thin|medium|wide",
    "watch": "dress|sport|casual"
  },
  "confidence_score": 90
}

Focus on enhancing this person's best features and creating a balanced, flattering silhouette.`;

      const response = await GeminiService.getMandyResponse(prompt, 'TEXT_PLUS_IMAGE', [bodyImage]);
      
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysisData = JSON.parse(jsonMatch[0]);
        setBodyAnalysis(analysisData);
        onBodyAnalysisComplete(analysisData);
      } else {
        // Fallback analysis
        const fallbackAnalysis = createFallbackAnalysis();
        setBodyAnalysis(fallbackAnalysis);
        onBodyAnalysisComplete(fallbackAnalysis);
      }
    } catch (error) {
      console.error('Body analysis error:', error);
      setError('Failed to analyze body type. Using general recommendations.');
      
      const fallbackAnalysis = createFallbackAnalysis();
      setBodyAnalysis(fallbackAnalysis);
      onBodyAnalysisComplete(fallbackAnalysis);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createFallbackAnalysis = () => {
    return {
      body_analysis: {
        body_type: 'athletic',
        build: 'average',
        height_estimate: 'average',
        shoulder_width: 'average',
        torso_shape: 'straight',
        proportions: 'Well-balanced proportions'
      },
      suit_recommendations: {
        jacket_style: 'single_breasted',
        jacket_fit: 'regular',
        lapel_style: 'notched',
        button_count: '2',
        shoulder_construction: 'natural',
        jacket_length: 'regular',
        jacket_suppression: 'medium'
      },
      trouser_recommendations: {
        fit: 'straight',
        rise: 'mid',
        break: 'slight_break',
        pleats: 'flat_front',
        cuff: 'no_cuff'
      },
      shirt_recommendations: {
        fit: 'regular',
        collar: 'spread',
        pattern: 'solid'
      },
      color_recommendations: {
        best_colors: ['navy', 'charcoal', 'burgundy'],
        avoid_colors: ['overly bright colors'],
        skin_tone: 'neutral'
      },
      styling_tips: [
        'Focus on clean, classic lines',
        'Ensure proper fit across shoulders',
        'Maintain consistent proportions'
      ],
      accessory_recommendations: {
        tie_width: 'regular',
        pocket_square: 'classic white linen',
        belt: 'medium',
        watch: 'dress'
      },
      confidence_score: 75
    };
  };

  // Auto-analyze when body image is provided
  useEffect(() => {
    if (bodyImage && !bodyAnalysis) {
      analyzeBodyType();
    }
  }, [bodyImage]);

  if (!bodyImage) {
    return (
      <div className="body-analyzer p-4 glass-morphism rounded-lg">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">👤</div>
          <p>Upload your photo for personalized fit and style recommendations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="body-analyzer p-4 glass-morphism rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          👤 Body Type Analysis
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={analyzeBodyType}
            disabled={isAnalyzing}
            className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:bg-gray-500"
          >
            {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
          </button>
          {bodyAnalysis && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              bodyAnalysis.confidence_score > 80 ? 'bg-green-500 text-white' :
              bodyAnalysis.confidence_score > 60 ? 'bg-yellow-500 text-black' :
              'bg-gray-500 text-white'
            }`}>
              {bodyAnalysis.confidence_score}% confidence
            </span>
          )}
        </div>
      </div>

      {/* Body Image Preview */}
      <div className="mb-4">
        <div className="w-full h-32 bg-gray-800/50 rounded-lg border border-gray-600 flex items-center justify-center">
          <span className="text-gray-400 text-sm">📷 Body photo analyzed</span>
        </div>
      </div>

      {isAnalyzing && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-300">Analyzing your body type for perfect fit recommendations...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {bodyAnalysis && (
        <div className="analysis-results space-y-4">
          {/* Body Type Overview */}
          <div className="body-overview bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-md font-semibold text-white mb-3">📊 Body Analysis</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Body Type:</span>
                <span className="ml-2 text-white font-medium capitalize">{bodyAnalysis.body_analysis?.body_type}</span>
              </div>
              <div>
                <span className="text-gray-400">Build:</span>
                <span className="ml-2 text-white font-medium capitalize">{bodyAnalysis.body_analysis?.build}</span>
              </div>
              <div>
                <span className="text-gray-400">Height:</span>
                <span className="ml-2 text-white font-medium capitalize">{bodyAnalysis.body_analysis?.height_estimate}</span>
              </div>
              <div>
                <span className="text-gray-400">Shoulders:</span>
                <span className="ml-2 text-white font-medium capitalize">{bodyAnalysis.body_analysis?.shoulder_width}</span>
              </div>
            </div>
            {bodyAnalysis.body_analysis?.proportions && (
              <div className="mt-3">
                <span className="text-gray-400 text-sm">Proportions:</span>
                <p className="text-white mt-1">{bodyAnalysis.body_analysis.proportions}</p>
              </div>
            )}
          </div>

          {/* Suit Recommendations */}
          <div className="suit-recommendations bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-md font-semibold text-white mb-3">🤵 Perfect Suit for You</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-purple-400">Style:</span>
                <span className="ml-2 text-white capitalize">{bodyAnalysis.suit_recommendations?.jacket_style?.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-purple-400">Fit:</span>
                <span className="ml-2 text-white capitalize">{bodyAnalysis.suit_recommendations?.jacket_fit}</span>
              </div>
              <div>
                <span className="text-purple-400">Lapels:</span>
                <span className="ml-2 text-white capitalize">{bodyAnalysis.suit_recommendations?.lapel_style}</span>
              </div>
              <div>
                <span className="text-purple-400">Buttons:</span>
                <span className="ml-2 text-white">{bodyAnalysis.suit_recommendations?.button_count} button</span>
              </div>
              <div>
                <span className="text-purple-400">Shoulders:</span>
                <span className="ml-2 text-white capitalize">{bodyAnalysis.suit_recommendations?.shoulder_construction}</span>
              </div>
              <div>
                <span className="text-purple-400">Length:</span>
                <span className="ml-2 text-white capitalize">{bodyAnalysis.suit_recommendations?.jacket_length}</span>
              </div>
            </div>
          </div>

          {/* Trouser Recommendations */}
          <div className="trouser-recommendations bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-md font-semibold text-white mb-3">👖 Trouser Specifications</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-400">Fit:</span>
                <span className="ml-2 text-white capitalize">{bodyAnalysis.trouser_recommendations?.fit}</span>
              </div>
              <div>
                <span className="text-blue-400">Rise:</span>
                <span className="ml-2 text-white capitalize">{bodyAnalysis.trouser_recommendations?.rise?.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-blue-400">Break:</span>
                <span className="ml-2 text-white capitalize">{bodyAnalysis.trouser_recommendations?.break?.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-blue-400">Style:</span>
                <span className="ml-2 text-white capitalize">{bodyAnalysis.trouser_recommendations?.pleats?.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Color Recommendations */}
          {bodyAnalysis.color_recommendations && (
            <div className="color-recommendations bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-md font-semibold text-white mb-3">🎨 Your Best Colors</h4>
              <div className="mb-3">
                <span className="text-green-400 text-sm font-medium">Perfect Colors:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {bodyAnalysis.color_recommendations.best_colors?.map(color => (
                    <span key={color} className="inline-block bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded capitalize">
                      {color}
                    </span>
                  ))}
                </div>
              </div>
              {bodyAnalysis.color_recommendations.avoid_colors?.length > 0 && (
                <div className="mb-3">
                  <span className="text-red-400 text-sm font-medium">Avoid:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {bodyAnalysis.color_recommendations.avoid_colors.map(color => (
                      <span key={color} className="inline-block bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded capitalize">
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="text-gray-400 text-sm">Skin Tone:</span>
                <span className="ml-2 text-white font-medium capitalize">{bodyAnalysis.color_recommendations.skin_tone}</span>
              </div>
            </div>
          )}

          {/* Styling Tips */}
          {bodyAnalysis.styling_tips && bodyAnalysis.styling_tips.length > 0 && (
            <div className="styling-tips bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h4 className="text-md font-semibold text-yellow-300 mb-3">💡 Pro Styling Tips</h4>
              <ul className="space-y-2">
                {bodyAnalysis.styling_tips.map((tip, index) => (
                  <li key={index} className="text-yellow-200 text-sm">
                    <span className="text-yellow-400 mr-2">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Accessory Recommendations */}
          {bodyAnalysis.accessory_recommendations && (
            <div className="accessory-recommendations bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-md font-semibold text-white mb-3">⌚ Perfect Accessories</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-pink-400">Tie Width:</span>
                  <span className="ml-2 text-white capitalize">{bodyAnalysis.accessory_recommendations.tie_width}</span>
                </div>
                <div>
                  <span className="text-pink-400">Belt:</span>
                  <span className="ml-2 text-white capitalize">{bodyAnalysis.accessory_recommendations.belt}</span>
                </div>
                <div>
                  <span className="text-pink-400">Watch:</span>
                  <span className="ml-2 text-white capitalize">{bodyAnalysis.accessory_recommendations.watch}</span>
                </div>
                <div>
                  <span className="text-pink-400">Pocket Square:</span>
                  <span className="ml-2 text-white capitalize">{bodyAnalysis.accessory_recommendations.pocket_square}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BodyAnalyzer;