import React, { useState, useEffect } from 'react';
import { ImageStorageService } from '../services/imageStorageService';
import { Download, Save, Trash2, RefreshCw } from 'lucide-react';

const OutfitVisualizer = ({ 
  context, 
  clothingAnalysis, 
  locationAnalysis, 
  bodyAnalysis, 
  onVisualizationComplete 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [currentVisualization, setCurrentVisualization] = useState(null);
  const [error, setError] = useState(null);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);
  const [manualResponse, setManualResponse] = useState('');

  const generateOutfitVisualization = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Create comprehensive prompt for outfit visualization
      const prompt = createVisualizationPrompt();
      setGenerationPrompt(prompt);
      setShowPrompt(true);
      setIsGenerating(false);
    } catch (error) {
      console.error('Prompt generation error:', error);
      setError('Failed to generate prompt. Please try again.');
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = (imageId, filename = null) => {
    const success = ImageStorageService.downloadImage(imageId, filename);
    if (!success) {
      setError('Failed to download image');
    }
  };

  useEffect(() => {
    const savedImages = ImageStorageService.getAllImages();
    const recentImages = savedImages.slice(0, 5);
    setGeneratedImages(recentImages);
    
    if (recentImages.length > 0 && !currentVisualization) {
      setCurrentVisualization(recentImages[0]);
    }
  }, []);

  const createVisualizationPrompt = () => {
    const occasion = context.goal || 'business meeting';
    const location = context.location || 'professional venue';
    
    const suitStyle = bodyAnalysis?.suit_recommendations?.jacket_style || 'single-breasted';
    const suitFit = bodyAnalysis?.suit_recommendations?.jacket_fit || 'regular';
    const primaryColors = bodyAnalysis?.color_recommendations?.best_colors || locationAnalysis?.color_palette || ['navy', 'charcoal'];
    const formalityLevel = locationAnalysis?.formality_level || 'high';
    
    let prompt = `Create a photorealistic, high-resolution image of a professional person wearing a complete business outfit. SPECIFIC REQUIREMENTS:\n\n`;
    
    // Suit specifications
    const suitColor = primaryColors[0] || 'navy';
    prompt += `SUIT: ${suitColor} colored ${suitStyle} suit jacket with ${suitFit} fit. The suit should have notched lapels, two buttons, and be made of wool fabric. The jacket should fit perfectly across the shoulders with proper sleeve length showing 1/4 to 1/2 inch of shirt cuff.\n\n`;
    
    // Trouser specifications  
    if (bodyAnalysis?.trouser_recommendations) {
      prompt += `TROUSERS: Matching ${suitColor} suit trousers with ${bodyAnalysis.trouser_recommendations.fit} fit, ${bodyAnalysis.trouser_recommendations.break} break at the shoes, and a pressed crease down the front.\n\n`;
    } else {
      prompt += `TROUSERS: Matching ${suitColor} suit trousers with regular fit, slight break at the shoes, and a pressed crease down the front.\n\n`;
    }
    
    // Shirt specifications
    const shirtColor = bodyAnalysis?.color_recommendations?.best_colors?.includes('white') ? 'crisp white' : 'light blue';
    prompt += `SHIRT: ${shirtColor} dress shirt with spread collar, French cuffs with silver cufflinks, and perfect fit with no wrinkles or bunching.\n\n`;
    
    // Tie specifications
    const tieColor = suitColor === 'navy' ? 'burgundy red with subtle diagonal pattern' : 'navy blue with small polka dots';
    prompt += `TIE: ${tieColor} silk necktie tied in a Four-in-Hand knot, properly positioned with the tip touching the belt buckle.\n\n`;
    
    // Shoe specifications
    prompt += `SHOES: Black leather oxford dress shoes with cap-toe design, polished to a mirror shine, matching black leather belt.\n\n`;
    
    // Accessories
    if (bodyAnalysis?.accessory_recommendations) {
      prompt += `ACCESSORIES: ${bodyAnalysis.accessory_recommendations.watch || 'Silver dress watch'} on left wrist, ${bodyAnalysis.accessory_recommendations.pocket_square || 'white linen pocket square'} folded neatly in jacket breast pocket.\n\n`;
    } else {
      prompt += `ACCESSORIES: Silver dress watch on left wrist, white linen pocket square folded neatly in jacket breast pocket.\n\n`;
    }
    
    // Body and posture
    if (bodyAnalysis?.body_analysis?.body_type) {
      prompt += `BODY TYPE: Person has ${bodyAnalysis.body_analysis.body_type} build. The suit should be tailored to complement this body type with perfect proportions.\n\n`;
    }
    
    // Setting and background
    if (locationAnalysis?.venue_type) {
      prompt += `BACKGROUND: ${locationAnalysis.venue_type} setting with professional ambiance - `;
      if (locationAnalysis.venue_type.includes('office')) {
        prompt += `modern office environment with neutral colors and professional lighting.\n\n`;
      } else if (locationAnalysis.venue_type.includes('restaurant')) {
        prompt += `upscale restaurant interior with warm, elegant lighting.\n\n`;
      } else {
        prompt += `sophisticated professional environment with appropriate lighting.\n\n`;
      }
    } else {
      prompt += `BACKGROUND: Modern professional office setting with clean, neutral background and excellent lighting.\n\n`;
    }
    
    // Photography and quality specifications
    prompt += `PHOTOGRAPHY SPECIFICATIONS: Shot with professional camera, 85mm lens, shallow depth of field focusing on the person, studio-quality lighting, high resolution, sharp focus on fabric textures and details. The person should be positioned at a slight three-quarter angle, looking confident and professional with good posture.\n\n`;
    
    prompt += `FINAL REQUIREMENTS: Ensure all clothing items fit perfectly with no wrinkles, bunching, or poor tailoring. Colors should be rich and accurate. Fabric textures should be clearly visible. The overall appearance should be impeccable and suitable for ${occasion} at ${location}.`;
    
    return prompt;
  };

  const extractRecommendations = () => {
    return {
      suit: {
        style: bodyAnalysis?.suit_recommendations?.jacket_style || 'single-breasted',
        fit: bodyAnalysis?.suit_recommendations?.jacket_fit || 'regular',
        color: bodyAnalysis?.color_recommendations?.best_colors?.[0] || 'navy',
        fabric: 'wool'
      },
      shirt: {
        color: 'white',
        collar: bodyAnalysis?.shirt_recommendations?.collar || 'spread',
        fit: bodyAnalysis?.shirt_recommendations?.fit || 'regular'
      },
      accessories: {
        tie: 'silk tie in complementary color',
        pocket_square: bodyAnalysis?.accessory_recommendations?.pocket_square || 'white linen',
        watch: bodyAnalysis?.accessory_recommendations?.watch || 'dress watch',
        shoes: 'black leather dress shoes'
      },
      styling_notes: bodyAnalysis?.styling_tips || [
        'Ensure perfect fit across shoulders',
        'Maintain clean, pressed appearance',
        'Pay attention to proportion and balance'
      ]
    };
  };

  const createFallbackVisualization = () => {
    const fallbackViz = {
      id: Date.now(),
      imageUrl: null,
      prompt: generationPrompt,
      context: {
        occasion: context.goal,
        location: context.location,
        relationship: context.relationship
      },
      recommendations: extractRecommendations(),
      timestamp: new Date().toISOString(),
      fallback: true,
      description: `Perfect outfit for ${context.goal}: Navy single-breasted suit with crisp white shirt, silk tie, and polished dress shoes. Tailored fit with attention to proportion and professional presentation.`
    };
    
    setCurrentVisualization(fallbackViz);
    onVisualizationComplete(fallbackViz);
  };

  const processManualResponse = () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Parse the manual response - expecting base64 image data
      const response = {
        imageUrl: manualResponse.startsWith('data:') ? manualResponse : `data:image/png;base64,${manualResponse}`,
        imageData: manualResponse.replace(/^data:image\/[a-z]+;base64,/, ''),
        success: true,
        description: 'Manual demo image'
      };

      // Prepare image data for storage
      const imageDataForStorage = {
        ...response,
        context: {
          occasion: context.goal,
          location: context.location,
          relationship: context.relationship
        },
        recommendations: extractRecommendations()
      };

      // Save image to storage
      const imageId = ImageStorageService.saveImage(imageDataForStorage);

      const newVisualization = {
        id: imageId || Date.now(),
        imageUrl: response.imageUrl,
        imageData: response.imageData,
        prompt: generationPrompt,
        context: imageDataForStorage.context,
        recommendations: imageDataForStorage.recommendations,
        timestamp: new Date().toISOString(),
        success: response.success,
        description: response.description
      };
      
      setCurrentVisualization(newVisualization);
      setGeneratedImages(prev => [newVisualization, ...prev.slice(0, 4)]);
      onVisualizationComplete(newVisualization);
      
      // Hide prompt interface
      setShowPrompt(false);
      setManualResponse('');
      
      console.log('✅ Manual outfit visualization processed and saved:', imageId);
    } catch (error) {
      console.error('Manual visualization error:', error);
      setError('Failed to process manual response. Please check the image data format.');
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateWithModification = async (modification) => {
    setError(null);
    const modifiedPrompt = generationPrompt + ` ${modification}`;
    setGenerationPrompt(modifiedPrompt);
    setShowPrompt(true);
    setManualResponse('');
    // Show manual testing interface instead of calling Gemini
  };

  const hasRequiredData = context && (context.goal || context.location);

  const renderRequirements = () => {
    const requirements = [
      { 
        name: 'Occasion/Goal', 
        met: !!context?.goal, 
        value: context?.goal || 'Not specified' 
      },
      { 
        name: 'Location', 
        met: !!context?.location, 
        value: context?.location || 'Not specified' 
      },
      { 
        name: 'Body Analysis', 
        met: !!bodyAnalysis, 
        value: bodyAnalysis ? 'Analyzed' : 'Not analyzed' 
      },
      { 
        name: 'Style Preferences', 
        met: !!locationAnalysis, 
        value: locationAnalysis ? 'Set' : 'Not set' 
      }
    ];

    return requirements.map((req, index) => (
      <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${req.met ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
        <div className={`w-3 h-3 rounded-full ${req.met ? 'bg-green-500' : 'bg-red-500'}`} />
        <div className="flex-1">
          <p className={`font-medium text-sm ${req.met ? 'text-green-300' : 'text-red-300'}`}>
            {req.name}
          </p>
          <p className="text-gray-400 text-xs">{req.value}</p>
        </div>
      </div>
    ));
  };

  return (
    <div className="outfit-visualizer p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            <span className="mr-3">👔</span>
            Your Outfit Visualization
          </h2>
          
          {/* Generation Button */}
          {hasRequiredData && (
            <button
              onClick={generateOutfitVisualization}
              disabled={isGenerating}
              className={`px-6 py-2 rounded-lg font-medium text-white transition-all duration-300 flex items-center gap-2
                ${isGenerating 
                  ? 'bg-purple-400 cursor-not-allowed animate-pulse' 
                  : 'bg-purple-600 hover:bg-purple-700 hover:scale-105'
                }`}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Generate Look
                </>
              )}
            </button>
          )}
        </div>
        
        {/* Requirements Status */}
        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">Generation Requirements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {renderRequirements()}
          </div>
        </div>

        {/* Generate Button (if data ready) */}
        {hasRequiredData && !currentVisualization && !isGenerating && (
          <button
            onClick={generateOutfitVisualization}
            disabled={isGenerating}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 
                       text-white rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3
                       shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] mb-6"
          >
            <RefreshCw className="w-6 h-6" />
            Generate Your Perfect Look
          </button>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="text-center py-12 bg-gray-800/50 rounded-lg mb-6">
            <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-300 text-lg">Creating your perfect outfit visualization...</p>
            <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Manual Testing Interface */}
        {showPrompt && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 mb-6">
            <h3 className="text-blue-300 font-semibold text-lg mb-4">🔧 Manual Testing Mode</h3>
            
            {/* Generated Prompt */}
            <div className="mb-4">
              <label className="block text-blue-200 text-sm font-medium mb-2">
                Generated Prompt (copy this to Gemini):
              </label>
              <div className="relative">
                <textarea
                  value={generationPrompt}
                  readOnly
                  className="w-full h-32 p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 text-sm font-mono resize-none"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(generationPrompt)}
                  className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Manual Response Input */}
            <div className="mb-4">
              <label className="block text-blue-200 text-sm font-medium mb-2">
                Paste Gemini Response (base64 image data):
              </label>
              <textarea
                value={manualResponse}
                onChange={(e) => setManualResponse(e.target.value)}
                placeholder="Paste the base64 image data from Gemini here..."
                className="w-full h-24 p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 text-sm resize-none"
              />
            </div>

            {/* Process Button */}
            <div className="flex gap-3">
              <button
                onClick={processManualResponse}
                disabled={!manualResponse.trim() || isGenerating}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {isGenerating ? 'Processing...' : 'Process Response'}
              </button>
              <button
                onClick={() => {
                  setShowPrompt(false);
                  setManualResponse('');
                  setGenerationPrompt('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="mt-3 text-xs text-blue-300">
              💡 Instructions: Copy the prompt above, paste it into Gemini image generation, then paste the resulting base64 image data back here.
            </div>
          </div>
        )}

        {/* Current Visualization */}
        {currentVisualization && (
          <div className="space-y-6">
            
            {/* Main Image */}
            <div className="bg-gray-800/30 rounded-lg overflow-hidden">
              <div className="relative">
                {currentVisualization.imageUrl ? (
                  <img
                    src={currentVisualization.imageUrl}
                    alt="Current outfit visualization"
                    className="w-full h-auto object-contain max-h-96 mx-auto"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-gray-700">
                    <div className="text-center">
                      <span className="text-6xl mb-4 block">🤵</span>
                      <p className="text-gray-300">Image generation in progress...</p>
                    </div>
                  </div>
                )}
                
                {/* Download Button */}
                {currentVisualization.imageUrl && (
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => handleDownloadImage(currentVisualization.id, `aura_outfit_${currentVisualization.id}.png`)}
                      className="px-3 py-2 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg shadow-lg transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Download</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Outfit Details */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Current Look Info */}
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h4 className="text-white font-semibold text-lg mb-4">Current Look</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400 text-sm">Occasion:</span>
                    <p className="text-white">{currentVisualization.context.occasion}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Location:</span>
                    <p className="text-white">{currentVisualization.context.location}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Generated:</span>
                    <p className="text-purple-400 text-sm">
                      {new Date(currentVisualization.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Style Breakdown */}
              {currentVisualization.recommendations && (
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h4 className="text-white font-semibold text-lg mb-4">Style Breakdown</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-purple-400 font-medium">Suit:</span>
                      <p className="text-gray-300 ml-2">
                        {currentVisualization.recommendations.suit.color} {currentVisualization.recommendations.suit.style}
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-400 font-medium">Shirt:</span>
                      <p className="text-gray-300 ml-2">
                        {currentVisualization.recommendations.shirt.color} dress shirt
                      </p>
                    </div>
                    <div>
                      <span className="text-pink-400 font-medium">Accessories:</span>
                      <div className="text-gray-300 ml-2 space-y-1">
                        <p>• {currentVisualization.recommendations.accessories.tie}</p>
                        <p>• {currentVisualization.recommendations.accessories.shoes}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Modifications */}
            <div className="bg-gray-800/50 rounded-lg p-6">
              <h4 className="text-white font-semibold text-lg mb-4">🔄 Quick Adjustments</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => regenerateWithModification('Change the tie to a burgundy red color with subtle diagonal stripes')}
                  disabled={isGenerating}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-500"
                >
                  Change Tie Color
                </button>
                <button
                  onClick={() => regenerateWithModification('Add a charcoal gray three-button vest with silver buttons matching the suit')}
                  disabled={isGenerating}
                  className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-gray-500"
                >
                  Add Vest
                </button>
                <button
                  onClick={() => regenerateWithModification('Change to a light blue dress shirt with thin white pinstripes and French cuffs')}
                  disabled={isGenerating}
                  className="px-4 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:bg-gray-500"
                >
                  Pattern Shirt
                </button>
                <button
                  onClick={() => regenerateWithModification('Replace the tie with no tie, unbutton the top shirt button, and add a subtle pocket square for smart-casual professional appearance')}
                  disabled={isGenerating}
                  className="px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors disabled:bg-gray-500"
                >
                  More Casual
                </button>
              </div>
            </div>

            {/* Regenerate Button */}
            <button
              onClick={generateOutfitVisualization}
              disabled={isGenerating}
              className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium
                         transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Generating New Look...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Generate New Look
                </>
              )}
            </button>

            {/* Previous Generations */}
            {generatedImages.length > 1 && (
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h4 className="text-white font-semibold text-lg mb-4">📱 Previous Looks</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {generatedImages.slice(1).map(img => (
                    <div
                      key={img.id}
                      className="aspect-square bg-gray-700 rounded-lg overflow-hidden relative group cursor-pointer"
                      onClick={() => setCurrentVisualization(img)}
                    >
                      {img.imageUrl ? (
                        <img
                          src={img.imageUrl}
                          alt="Previous look"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl">🤵</span>
                        </div>
                      )}
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium">Select</span>
                      </div>
                      
                      {/* Download button */}
                      {img.imageUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadImage(img.id, `thumbnail_${img.id}.png`);
                          }}
                          className="absolute top-2 right-2 p-1 bg-blue-600/90 hover:bg-blue-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!currentVisualization && !isGenerating && (
          <div className="text-center py-12">
            <div className="text-8xl mb-6">🎨</div>
            <p className="text-xl text-gray-300 mb-2">Ready to visualize your perfect outfit?</p>
            <p className="text-gray-500">
              {hasRequiredData 
                ? 'Click the Generate button above to create your look!' 
                : 'Complete your profile to generate your perfect outfit visualization'
              }
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default OutfitVisualizer;