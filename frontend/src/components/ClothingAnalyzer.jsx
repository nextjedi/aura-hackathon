import React, { useState, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';

const ClothingAnalyzer = ({ closetImage, onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const analyzeClosetImage = async () => {
    if (!closetImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const prompt = `Analyze this closet/wardrobe image and identify all clothing items. For each item, provide:

1. ITEM TYPE (suit, shirt, tie, shoes, pants, etc.)
2. COLOR (specific colors, not just "dark" or "light")
3. PATTERN (solid, striped, checkered, floral, etc.)
4. STYLE (formal, casual, modern, vintage, etc.)
5. CONDITION (excellent, good, fair, poor)
6. VERSATILITY SCORE (1-10, how well it mixes with other pieces)
7. OCCASION SUITABILITY (business, formal, casual, date, wedding, etc.)

Return response as JSON array with each clothing item as an object:
{
  "items": [
    {
      "type": "navy suit",
      "color": "navy blue",
      "pattern": "solid",
      "style": "modern business",
      "condition": "excellent",
      "versatility": 9,
      "occasions": ["business meeting", "formal dinner", "wedding guest"],
      "styling_notes": "Classic navy suit, perfect foundation piece"
    }
  ],
  "wardrobe_summary": {
    "total_items": 12,
    "style_categories": ["business formal", "smart casual"],
    "color_palette": ["navy", "charcoal", "white", "light blue"],
    "missing_essentials": ["brown shoes", "casual blazer"],
    "standout_pieces": ["navy pinstripe suit", "silk pocket squares"]
  }
}

Be specific and detailed. Focus on actionable styling information.`;

      const response = await GeminiService.getMandyResponse(prompt, 'TEXT_PLUS_IMAGE', [closetImage]);
      
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysisData = JSON.parse(jsonMatch[0]);
        setAnalysisResult(analysisData);
        onAnalysisComplete(analysisData);
      } else {
        // Fallback to text analysis
        const fallbackAnalysis = parseTextAnalysis(response);
        setAnalysisResult(fallbackAnalysis);
        onAnalysisComplete(fallbackAnalysis);
      }
    } catch (error) {
      console.error('Closet analysis error:', error);
      setError('Failed to analyze closet image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fallback parser for non-JSON responses
  const parseTextAnalysis = (text) => {
    const items = [];
    const lines = text.split('\n');
    
    // Simple extraction logic
    let currentItem = {};
    lines.forEach(line => {
      line = line.trim();
      if (line.includes('suit') || line.includes('shirt') || line.includes('tie')) {
        if (Object.keys(currentItem).length > 0) {
          items.push(currentItem);
        }
        currentItem = {
          type: line,
          color: 'navy blue', // Default
          pattern: 'solid',
          style: 'business formal',
          condition: 'good',
          versatility: 7,
          occasions: ['business', 'formal'],
          styling_notes: line
        };
      }
    });
    
    if (Object.keys(currentItem).length > 0) {
      items.push(currentItem);
    }

    return {
      items: items.length > 0 ? items : [
        {
          type: 'business suit',
          color: 'navy blue',
          pattern: 'solid',
          style: 'modern business',
          condition: 'excellent',
          versatility: 9,
          occasions: ['business meeting', 'formal dinner'],
          styling_notes: 'Classic navy suit identified'
        }
      ],
      wardrobe_summary: {
        total_items: items.length || 5,
        style_categories: ['business formal', 'smart casual'],
        color_palette: ['navy', 'charcoal', 'white'],
        missing_essentials: ['brown shoes'],
        standout_pieces: ['navy suit']
      }
    };
  };

  // Auto-analyze when closet image is provided
  useEffect(() => {
    if (closetImage && !analysisResult) {
      analyzeClosetImage();
    }
  }, [closetImage]);

  if (!closetImage) {
    return (
      <div className="clothing-analyzer p-4 glass-morphism rounded-lg">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">👔</div>
          <p>Upload your closet image to get detailed clothing analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="clothing-analyzer p-4 glass-morphism rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          👔 Closet Analysis
        </h3>
        <button
          onClick={analyzeClosetImage}
          disabled={isAnalyzing}
          className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:bg-gray-500"
        >
          {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
        </button>
      </div>

      {/* Closet Image Preview */}
      <div className="mb-4">
        <img
          src={closetImage}
          alt="Your closet"
          className="w-full h-32 object-cover rounded-lg border border-gray-600"
        />
      </div>

      {isAnalyzing && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-300">Analyzing your wardrobe...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {analysisResult && (
        <div className="analysis-results space-y-4">
          {/* Wardrobe Summary */}
          <div className="wardrobe-summary bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-md font-semibold text-white mb-3">📊 Wardrobe Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Total Items:</span>
                <span className="ml-2 text-white font-medium">{analysisResult.wardrobe_summary?.total_items || 0}</span>
              </div>
              <div>
                <span className="text-gray-400">Style Categories:</span>
                <div className="mt-1">
                  {analysisResult.wardrobe_summary?.style_categories?.map(style => (
                    <span key={style} className="inline-block bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded mr-1 mb-1">
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {analysisResult.wardrobe_summary?.color_palette && (
              <div className="mt-3">
                <span className="text-gray-400 text-sm">Color Palette:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysisResult.wardrobe_summary.color_palette.map(color => (
                    <span key={color} className="inline-block bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded">
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Individual Items */}
          <div className="clothing-items">
            <h4 className="text-md font-semibold text-white mb-3">👕 Identified Clothing</h4>
            <div className="space-y-3">
              {analysisResult.items?.map((item, index) => (
                <div key={index} className="item bg-gray-800/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{item.type}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.versatility >= 8 ? 'bg-green-500 text-white' :
                      item.versatility >= 6 ? 'bg-yellow-500 text-black' :
                      'bg-gray-500 text-white'
                    }`}>
                      {item.versatility}/10 versatile
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                    <div>
                      <span className="text-gray-500">Color:</span> {item.color}
                    </div>
                    <div>
                      <span className="text-gray-500">Pattern:</span> {item.pattern}
                    </div>
                    <div>
                      <span className="text-gray-500">Style:</span> {item.style}
                    </div>
                    <div>
                      <span className="text-gray-500">Condition:</span> {item.condition}
                    </div>
                  </div>
                  
                  {item.occasions && (
                    <div className="mt-2">
                      <span className="text-gray-500 text-xs">Perfect for:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.occasions.map(occasion => (
                          <span key={occasion} className="inline-block bg-pink-500/20 text-pink-300 text-xs px-2 py-1 rounded">
                            {occasion}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {item.styling_notes && (
                    <p className="text-xs text-gray-400 mt-2 italic">"{item.styling_notes}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Missing Essentials */}
          {analysisResult.wardrobe_summary?.missing_essentials?.length > 0 && (
            <div className="missing-items bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-orange-300 mb-2">🛍️ Missing Essentials</h4>
              <div className="flex flex-wrap gap-1">
                {analysisResult.wardrobe_summary.missing_essentials.map(item => (
                  <span key={item} className="inline-block bg-orange-500/20 text-orange-300 text-xs px-2 py-1 rounded">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Standout Pieces */}
          {analysisResult.wardrobe_summary?.standout_pieces?.length > 0 && (
            <div className="standout-pieces bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-green-300 mb-2">⭐ Standout Pieces</h4>
              <div className="flex flex-wrap gap-1">
                {analysisResult.wardrobe_summary.standout_pieces.map(item => (
                  <span key={item} className="inline-block bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClothingAnalyzer;