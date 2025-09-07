import React, { useState, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';

const LocationAnalyzer = ({ location, venueImage, occasion, onLocationAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [locationAnalysis, setLocationAnalysis] = useState(null);
  const [error, setError] = useState(null);

  // Predefined venue knowledge base for quick matching
  const venueDatabase = {
    'taj patna': {
      type: 'luxury hotel',
      formality: 'high',
      ambiance: 'elegant and sophisticated',
      dress_code: 'formal business to black tie',
      color_recommendations: ['navy', 'charcoal', 'black', 'burgundy'],
      style_notes: 'Classic Indian luxury hotel requiring refined formal wear',
      specific_recommendations: {
        'business meeting': 'Navy suit with crisp white shirt and silk tie',
        'dinner date': 'Charcoal suit with burgundy pocket square',
        'wedding function': 'Black tuxedo or navy suit with Indian-inspired accessories'
      }
    },
    'taj hotel': {
      type: 'luxury hotel chain',
      formality: 'high',
      ambiance: 'refined luxury',
      dress_code: 'business formal to formal',
      color_recommendations: ['navy', 'charcoal', 'black'],
      style_notes: 'International luxury standard requiring impeccable formal attire'
    },
    'ritz carlton': {
      type: 'luxury hotel',
      formality: 'very high',
      ambiance: 'opulent and prestigious',
      dress_code: 'formal to black tie',
      color_recommendations: ['black', 'navy', 'charcoal'],
      style_notes: 'Ultra-luxury venue requiring the finest formal wear'
    },
    'country club': {
      type: 'private club',
      formality: 'medium-high',
      ambiance: 'traditional and exclusive',
      dress_code: 'smart casual to business formal',
      color_recommendations: ['navy', 'forest green', 'burgundy', 'khaki'],
      style_notes: 'Classic country club styling with preppy influences'
    },
    'restaurant': {
      type: 'dining venue',
      formality: 'medium',
      ambiance: 'varies by establishment',
      dress_code: 'smart casual to formal',
      color_recommendations: ['navy', 'charcoal', 'burgundy'],
      style_notes: 'Depends on restaurant tier - fine dining requires formal attire'
    },
    'office building': {
      type: 'corporate venue',
      formality: 'high',
      ambiance: 'professional and authoritative',
      dress_code: 'business formal',
      color_recommendations: ['navy', 'charcoal', 'dark gray'],
      style_notes: 'Conservative business attire with impeccable fit'
    },
    'wedding venue': {
      type: 'event space',
      formality: 'high',
      ambiance: 'celebratory and elegant',
      dress_code: 'formal to black tie',
      color_recommendations: ['navy', 'charcoal', 'burgundy', 'forest green'],
      style_notes: 'Avoid white, black, and red. Choose sophisticated colors that photograph well'
    }
  };

  const analyzeLocation = async () => {
    if (!location) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // First check if we have predefined knowledge
      const locationKey = location.toLowerCase();
      const predefinedVenue = Object.keys(venueDatabase).find(key => 
        locationKey.includes(key) || key.includes(locationKey.split(' ')[0])
      );

      if (predefinedVenue) {
        // Use predefined knowledge
        const venueData = venueDatabase[predefinedVenue];
        const analysis = {
          venue_name: location,
          venue_type: venueData.type,
          formality_level: venueData.formality,
          ambiance: venueData.ambiance,
          dress_code: venueData.dress_code,
          color_palette: venueData.color_recommendations,
          style_guidelines: venueData.style_notes,
          occasion_specific: venueData.specific_recommendations || {},
          confidence: 90
        };
        
        setLocationAnalysis(analysis);
        onLocationAnalysisComplete(analysis);
        setIsAnalyzing(false);
        return;
      }

      // If no predefined data, use AI analysis
      const basePrompt = `Analyze this venue/location for styling recommendations:

LOCATION: "${location}"
OCCASION: "${occasion || 'general visit'}"

Provide detailed analysis in JSON format:
{
  "venue_name": "${location}",
  "venue_type": "restaurant|hotel|office|club|event_space|etc",
  "formality_level": "low|medium|high|very_high",
  "ambiance": "description of the venue's atmosphere",
  "dress_code": "specific dress code requirements",
  "color_palette": ["recommended colors for this venue"],
  "style_guidelines": "specific styling recommendations",
  "occasion_specific": {
    "business": "recommendations for business occasions",
    "social": "recommendations for social occasions",
    "formal": "recommendations for formal occasions"
  },
  "cultural_considerations": "any cultural dress considerations",
  "seasonal_adjustments": "recommendations based on climate/season",
  "confidence": 85
}

Be specific about why certain styles work for this venue.`;

      let prompt = basePrompt;
      let apiType = 'TEXT_ONLY';
      let images = [];

      // If venue image is available, include it in analysis
      if (venueImage) {
        prompt += `

VENUE IMAGE: Analyze the provided image of the venue to understand:
- Interior design style and decor
- Lighting and ambiance
- Formality level based on visual cues
- Color scheme of the venue
- Type of clientele/dress standards visible

Use both the location name and visual analysis for comprehensive recommendations.`;
        apiType = 'TEXT_PLUS_IMAGE';
        images = [venueImage];
      }

      const response = await GeminiService.getMandyResponse(prompt, apiType, images);
      
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysisData = JSON.parse(jsonMatch[0]);
        setLocationAnalysis(analysisData);
        onLocationAnalysisComplete(analysisData);
      } else {
        // Fallback analysis
        const fallbackAnalysis = createFallbackAnalysis(location, occasion);
        setLocationAnalysis(fallbackAnalysis);
        onLocationAnalysisComplete(fallbackAnalysis);
      }
    } catch (error) {
      console.error('Location analysis error:', error);
      setError('Failed to analyze venue. Using default recommendations.');
      
      // Provide fallback analysis
      const fallbackAnalysis = createFallbackAnalysis(location, occasion);
      setLocationAnalysis(fallbackAnalysis);
      onLocationAnalysisComplete(fallbackAnalysis);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createFallbackAnalysis = (location, occasion) => {
    return {
      venue_name: location,
      venue_type: 'mixed venue',
      formality_level: 'medium-high',
      ambiance: 'professional and welcoming',
      dress_code: 'business formal recommended',
      color_palette: ['navy', 'charcoal', 'burgundy'],
      style_guidelines: 'Classic business formal with attention to fit and details',
      occasion_specific: {
        business: 'Navy suit with crisp white shirt and conservative tie',
        social: 'Charcoal suit with more relaxed shirt and tie combination',
        formal: 'Black or navy formal suit with premium accessories'
      },
      cultural_considerations: 'Standard business attire appropriate',
      confidence: 60
    };
  };

  // Auto-analyze when location changes
  useEffect(() => {
    if (location && !locationAnalysis) {
      analyzeLocation();
    }
  }, [location, venueImage]);

  if (!location) {
    return (
      <div className="location-analyzer p-4 glass-morphism rounded-lg">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">📍</div>
          <p>Specify a location to get venue-specific styling recommendations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="location-analyzer p-4 glass-morphism rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          📍 Venue Analysis: {location}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={analyzeLocation}
            disabled={isAnalyzing}
            className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:bg-gray-500"
          >
            {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
          </button>
          {locationAnalysis && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              locationAnalysis.confidence > 80 ? 'bg-green-500 text-white' :
              locationAnalysis.confidence > 60 ? 'bg-yellow-500 text-black' :
              'bg-gray-500 text-white'
            }`}>
              {locationAnalysis.confidence}% confidence
            </span>
          )}
        </div>
      </div>

      {/* Venue Image Preview */}
      {venueImage && (
        <div className="mb-4">
          <img
            src={venueImage}
            alt="Venue"
            className="w-full h-32 object-cover rounded-lg border border-gray-600"
          />
        </div>
      )}

      {isAnalyzing && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-300">Analyzing venue style requirements...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {locationAnalysis && (
        <div className="analysis-results space-y-4">
          {/* Venue Overview */}
          <div className="venue-overview bg-gray-800/50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Venue Type:</span>
                <span className="ml-2 text-white font-medium capitalize">{locationAnalysis.venue_type}</span>
              </div>
              <div>
                <span className="text-gray-400">Formality:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium capitalize ${
                  locationAnalysis.formality_level === 'very_high' || locationAnalysis.formality_level === 'high' ? 'bg-red-500 text-white' :
                  locationAnalysis.formality_level === 'medium' || locationAnalysis.formality_level === 'medium-high' ? 'bg-yellow-500 text-black' :
                  'bg-green-500 text-white'
                }`}>
                  {locationAnalysis.formality_level}
                </span>
              </div>
            </div>
            
            <div className="mt-3">
              <span className="text-gray-400 text-sm">Ambiance:</span>
              <p className="text-white mt-1">{locationAnalysis.ambiance}</p>
            </div>
            
            <div className="mt-3">
              <span className="text-gray-400 text-sm">Dress Code:</span>
              <p className="text-white mt-1 font-medium">{locationAnalysis.dress_code}</p>
            </div>
          </div>

          {/* Color Palette */}
          {locationAnalysis.color_palette && (
            <div className="color-palette bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">🎨 Recommended Colors</h4>
              <div className="flex flex-wrap gap-2">
                {locationAnalysis.color_palette.map(color => (
                  <span key={color} className="inline-block bg-blue-500/20 text-blue-300 text-sm px-3 py-1 rounded capitalize">
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Style Guidelines */}
          <div className="style-guidelines bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">✨ Style Guidelines</h4>
            <p className="text-gray-300 text-sm">{locationAnalysis.style_guidelines}</p>
          </div>

          {/* Occasion-Specific Recommendations */}
          {locationAnalysis.occasion_specific && Object.keys(locationAnalysis.occasion_specific).length > 0 && (
            <div className="occasion-recommendations bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-white mb-3">🎯 Occasion-Specific Recommendations</h4>
              <div className="space-y-3">
                {Object.entries(locationAnalysis.occasion_specific).map(([occasion, recommendation]) => (
                  <div key={occasion} className="occasion-item">
                    <span className="text-purple-400 font-medium capitalize text-sm">{occasion}:</span>
                    <p className="text-gray-300 text-sm mt-1 ml-2">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cultural Considerations */}
          {locationAnalysis.cultural_considerations && (
            <div className="cultural-considerations bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-orange-300 mb-2">🌏 Cultural Notes</h4>
              <p className="text-orange-200 text-sm">{locationAnalysis.cultural_considerations}</p>
            </div>
          )}

          {/* Seasonal Adjustments */}
          {locationAnalysis.seasonal_adjustments && (
            <div className="seasonal-adjustments bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-blue-300 mb-2">🌤️ Seasonal Considerations</h4>
              <p className="text-blue-200 text-sm">{locationAnalysis.seasonal_adjustments}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationAnalyzer;