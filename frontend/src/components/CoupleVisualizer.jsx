import React, { useState, useEffect } from 'react';
import { ImageStorageService } from '../services/imageStorageService';
import { Download, Save, Trash2, RefreshCw, Users, Star } from 'lucide-react';

const CoupleVisualizer = ({ 
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
  
  // Couple-specific state
  const [selectedCelebrity, setSelectedCelebrity] = useState('Ryan Gosling');
  const [coupleStyle, setCoupleStyle] = useState('coordinated'); // coordinated, complementary, contrasting
  const [occasionType, setOccasionType] = useState('date_night'); // date_night, red_carpet, casual_outing, formal_event

  // Celebrity options
  const celebrities = [
    { name: 'Ryan Gosling', style: 'classic Hollywood' },
    { name: 'Michael B. Jordan', style: 'modern sophisticated' },
    { name: 'Timothée Chalamet', style: 'avant-garde fashion-forward' },
    { name: 'Idris Elba', style: 'debonair gentleman' },
    { name: 'John Krasinski', style: 'approachable refined' },
    { name: 'Chris Evans', style: 'all-American classic' },
    { name: 'Oscar Isaac', style: 'artistic sophisticated' },
    { name: 'Dev Patel', style: 'eclectic modern' }
  ];

  const generateCoupleVisualization = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const prompt = createCoupleVisualizationPrompt();
      setGenerationPrompt(prompt);
      setShowPrompt(true);
      setIsGenerating(false);
    } catch (error) {
      console.error('Couple prompt generation error:', error);
      setError('Failed to generate couple visualization prompt. Please try again.');
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
    // Filter for couple visualizations
    const coupleImages = savedImages.filter(img => img.metadata?.visualizationType === 'couple').slice(0, 5);
    setGeneratedImages(coupleImages);
    
    if (coupleImages.length > 0 && !currentVisualization) {
      setCurrentVisualization(coupleImages[0]);
    }
  }, []);

  const createCoupleVisualizationPrompt = () => {
    const occasion = occasionType.replace('_', ' ') || 'date night';
    const location = context.location || 'upscale venue';
    const celebrity = celebrities.find(c => c.name === selectedCelebrity);
    
    const userSuitStyle = bodyAnalysis?.suit_recommendations?.jacket_style || 'single-breasted';
    const userSuitFit = bodyAnalysis?.suit_recommendations?.jacket_fit || 'regular';
    const primaryColors = bodyAnalysis?.color_recommendations?.best_colors || locationAnalysis?.color_palette || ['navy', 'charcoal'];
    
    let prompt = `Create a photorealistic, high-resolution image of an elegant couple dressed for ${occasion} at ${location}. SPECIFIC REQUIREMENTS:\n\n`;
    
    // User's outfit specifications
    const userSuitColor = primaryColors[0] || 'navy';
    prompt += `PERSON 1 (USER): ${userSuitColor} colored ${userSuitStyle} suit with ${userSuitFit} fit. `;
    prompt += `Perfect tailoring with notched lapels, two buttons, wool fabric. Crisp white dress shirt with spread collar. `;
    
    // Celebrity styling based on couple style preference
    let celebrityOutfit = '';
    switch (coupleStyle) {
      case 'coordinated':
        // Same color scheme, similar formality
        celebrityOutfit = `${userSuitColor} suit in similar style but with subtle differences - perhaps a different lapel style or three-piece configuration. `;
        break;
      case 'complementary':
        // Complementary colors that work well together
        const complementaryColor = userSuitColor === 'navy' ? 'charcoal gray' : 'deep navy';
        celebrityOutfit = `${complementaryColor} suit with similar formality level but different styling details. `;
        break;
      case 'contrasting':
        // Different but harmonious styles
        celebrityOutfit = `Different but elegant outfit - perhaps a tuxedo if user wears suit, or different color scheme that creates visual contrast while maintaining sophistication. `;
        break;
    }
    
    prompt += `\nPERSON 2 (${selectedCelebrity.toUpperCase()}): ${celebrityOutfit}`;
    prompt += `Styled in ${celebrity?.style || 'sophisticated modern'} aesthetic. Perfect fit and attention to detail. `;
    
    // Accessories and styling
    prompt += `\nACCESSORIES: Both wearing appropriate accessories - dress watches, complementary pocket squares, polished dress shoes. `;
    
    // Pose and composition
    prompt += `\nCOMPOSITION: Standing together in an elegant pose suitable for ${occasion}. Natural, confident body language showing connection as a well-dressed couple. `;
    
    // Background and setting
    if (occasionType === 'red_carpet') {
      prompt += `BACKGROUND: Red carpet event setting with elegant backdrop and professional lighting. `;
    } else if (occasionType === 'formal_event') {
      prompt += `BACKGROUND: Sophisticated formal venue - ballroom, gala, or upscale event space. `;
    } else if (occasionType === 'date_night') {
      prompt += `BACKGROUND: Upscale restaurant or elegant evening venue with warm, romantic lighting. `;
    } else {
      prompt += `BACKGROUND: Sophisticated setting appropriate for ${occasion} with excellent lighting. `;
    }
    
    // Photography specifications
    prompt += `\nPHOTOGRAPHY: Professional portrait photography, 85mm lens, shallow depth of field, studio-quality lighting highlighting both outfits equally. Full-body or 3/4 length composition showing both complete outfits. Rich colors, sharp focus on fabric textures and styling details. Both people should look confident, well-groomed, and perfectly styled.`;
    
    prompt += `\nFINAL REQUIREMENTS: Ensure both outfits are impeccably tailored with no wrinkles or poor fit. The styling should reflect ${coupleStyle} approach with attention to color harmony and formality matching. Suitable for ${occasion} at ${location}.`;
    
    return prompt;
  };

  const extractCoupleRecommendations = () => {
    return {
      user: {
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
        }
      },
      celebrity: {
        name: selectedCelebrity,
        style: celebrities.find(c => c.name === selectedCelebrity)?.style || 'sophisticated',
        outfit: `${coupleStyle} styling approach`
      },
      couple_dynamics: {
        style_approach: coupleStyle,
        occasion: occasionType.replace('_', ' '),
        color_harmony: 'professionally coordinated',
        formality_matching: 'perfectly aligned'
      }
    };
  };

  const processManualResponse = () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = {
        imageUrl: manualResponse.startsWith('data:') ? manualResponse : `data:image/png;base64,${manualResponse}`,
        imageData: manualResponse.replace(/^data:image\/[a-z]+;base64,/, ''),
        success: true,
        description: `Couple visualization with ${selectedCelebrity}`
      };

      const imageDataForStorage = {
        ...response,
        context: {
          occasion: occasionType.replace('_', ' '),
          location: context.location,
          celebrity: selectedCelebrity,
          coupleStyle: coupleStyle
        },
        recommendations: extractCoupleRecommendations(),
        metadata: {
          visualizationType: 'couple',
          celebrity: selectedCelebrity,
          coupleStyle: coupleStyle
        }
      };

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
        description: response.description,
        visualizationType: 'couple'
      };
      
      setCurrentVisualization(newVisualization);
      setGeneratedImages(prev => [newVisualization, ...prev.slice(0, 4)]);
      onVisualizationComplete && onVisualizationComplete(newVisualization);
      
      setShowPrompt(false);
      setManualResponse('');
      
      console.log('✅ Couple visualization processed and saved:', imageId);
    } catch (error) {
      console.error('Couple visualization error:', error);
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
  };

  const hasRequiredData = context && (context.goal || context.location);

  return (
    <div className="couple-visualizer p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            <span className="mr-3"><Users className="w-8 h-8 inline" /></span>
            Couple Visualization
          </h2>
          
          {/* Generation Button */}
          {hasRequiredData && (
            <button
              onClick={generateCoupleVisualization}
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
                  Generate Couple Look
                </>
              )}
            </button>
          )}
        </div>

        {/* Configuration Panel */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          
          {/* Celebrity Selection */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Celebrity Partner
            </h3>
            <select
              value={selectedCelebrity}
              onChange={(e) => setSelectedCelebrity(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              {celebrities.map(celebrity => (
                <option key={celebrity.name} value={celebrity.name}>
                  {celebrity.name}
                </option>
              ))}
            </select>
            <p className="text-gray-400 text-sm mt-2">
              {celebrities.find(c => c.name === selectedCelebrity)?.style}
            </p>
          </div>

          {/* Couple Style */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Style Approach</h3>
            <select
              value={coupleStyle}
              onChange={(e) => setCoupleStyle(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="coordinated">Coordinated - Same colors/style</option>
              <option value="complementary">Complementary - Different but matching</option>
              <option value="contrasting">Contrasting - Stylish opposites</option>
            </select>
          </div>

          {/* Occasion Type */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Occasion</h3>
            <select
              value={occasionType}
              onChange={(e) => setOccasionType(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="date_night">Date Night</option>
              <option value="red_carpet">Red Carpet Event</option>
              <option value="formal_event">Formal Event</option>
              <option value="casual_outing">Casual Outing</option>
            </select>
          </div>

        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Manual Testing Interface */}
        {showPrompt && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 mb-6">
            <h3 className="text-blue-300 font-semibold text-lg mb-4">🔧 Manual Testing Mode - Couple Visualization</h3>
            
            <div className="mb-4">
              <label className="block text-blue-200 text-sm font-medium mb-2">
                Generated Couple Prompt (copy this to Gemini):
              </label>
              <div className="relative">
                <textarea
                  value={generationPrompt}
                  readOnly
                  className="w-full h-40 p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 text-sm font-mono resize-none"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(generationPrompt)}
                  className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500"
                >
                  Copy
                </button>
              </div>
            </div>

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
              💡 This will generate a couple visualization with you and {selectedCelebrity} in {coupleStyle} styling for {occasionType.replace('_', ' ')}.
            </div>
          </div>
        )}

        {/* Current Visualization */}
        {currentVisualization && (
          <div className="space-y-6">
            
            {/* Main Couple Image */}
            <div className="bg-gray-800/30 rounded-lg overflow-hidden">
              <div className="relative">
                {currentVisualization.imageUrl ? (
                  <img
                    src={currentVisualization.imageUrl}
                    alt="Couple visualization"
                    className="w-full h-auto object-contain max-h-[600px] mx-auto"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-gray-700">
                    <div className="text-center">
                      <span className="text-6xl mb-4 block">👫</span>
                      <p className="text-gray-300">Couple visualization in progress...</p>
                    </div>
                  </div>
                )}
                
                {currentVisualization.imageUrl && (
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => handleDownloadImage(currentVisualization.id, `aura_couple_${currentVisualization.id}.png`)}
                      className="px-3 py-2 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg shadow-lg transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Download</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Couple Details */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Couple Info */}
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h4 className="text-white font-semibold text-lg mb-4">👫 Couple Details</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400 text-sm">Celebrity Partner:</span>
                    <p className="text-white">{currentVisualization.context?.celebrity || selectedCelebrity}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Style Approach:</span>
                    <p className="text-white capitalize">{currentVisualization.context?.coupleStyle || coupleStyle}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Occasion:</span>
                    <p className="text-white capitalize">{currentVisualization.context?.occasion || occasionType.replace('_', ' ')}</p>
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
                      <span className="text-purple-400 font-medium">Your Look:</span>
                      <p className="text-gray-300 ml-2">
                        {currentVisualization.recommendations.user?.suit?.color} {currentVisualization.recommendations.user?.suit?.style}
                      </p>
                    </div>
                    <div>
                      <span className="text-pink-400 font-medium">Celebrity Style:</span>
                      <p className="text-gray-300 ml-2">
                        {currentVisualization.recommendations.celebrity?.style} aesthetic
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-400 font-medium">Couple Harmony:</span>
                      <p className="text-gray-300 ml-2">
                        {currentVisualization.recommendations.couple_dynamics?.color_harmony}
                      </p>
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
                  onClick={() => regenerateWithModification('Change the lighting to golden hour for a more romantic atmosphere')}
                  disabled={isGenerating}
                  className="px-4 py-2 text-sm bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors disabled:bg-gray-500"
                >
                  Romantic Lighting
                </button>
                <button
                  onClick={() => regenerateWithModification('Add formal evening wear accessories - bow ties, cufflinks, and elegant jewelry')}
                  disabled={isGenerating}
                  className="px-4 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:bg-gray-500"
                >
                  Add Formal Accessories
                </button>
                <button
                  onClick={() => regenerateWithModification('Change the pose to a more casual, candid couple pose while maintaining the formal styling')}
                  disabled={isGenerating}
                  className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:bg-gray-500"
                >
                  Casual Pose
                </button>
                <button
                  onClick={() => regenerateWithModification('Switch to black-tie formal wear - tuxedos with matching elegant styling for both')}
                  disabled={isGenerating}
                  className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:bg-gray-500"
                >
                  Black Tie
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Empty State */}
        {!currentVisualization && !isGenerating && (
          <div className="text-center py-12">
            <div className="text-8xl mb-6">👫</div>
            <p className="text-xl text-gray-300 mb-2">Ready to create your perfect couple look?</p>
            <p className="text-gray-500">
              {hasRequiredData 
                ? 'Configure your preferences above and click Generate Couple Look!' 
                : 'Complete your profile to generate couple visualizations'
              }
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default CoupleVisualizer;