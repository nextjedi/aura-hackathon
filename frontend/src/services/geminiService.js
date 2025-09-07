// Direct Gemini API Service - Frontend Implementation
// Bypasses backend API issues by calling Gemini directly

const GEMINI_API_KEY = 'dummy_key_for_frontend_use_only'; // Replace with actual key in production
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Mock mode for testing when API quota is reached
const MOCK_MODE = false; // Set to true for testing, false for real API calls

// Models for different tasks
const MODELS = {
  TEXT: 'gemini-1.5-flash',
  VISION: 'gemini-1.5-flash', 
  IMAGE_GENERATION: 'gemini-2.5-flash-image-preview'
};

// Mock images from pics folder
const MOCK_IMAGES = [
  '/pics/outfit-1.jpg',
  '/pics/outfit-2.png', 
  '/pics/outfit-3.webp',
  '/pics/outfit-4.webp',
  '/pics/outfit-5.jpeg'
];

// Mock responses for testing
const MOCK_RESPONSES = {
  clothing_analysis: JSON.stringify({
    "type": "business suit",
    "color": "navy blue", 
    "style": "modern professional",
    "material": "premium wool blend",
    "confidence": 0.92,
    "suggestions": ["Perfect for business meetings", "Add a burgundy silk tie", "Consider black leather oxford shoes"]
  }),
  
  style_generation: `This navy business suit is absolutely perfect for your professional meeting! The tailored fit accentuates your athletic build beautifully. I recommend pairing it with a crisp white dress shirt, burgundy silk tie with subtle diagonal stripes, and polished black oxford shoes. Add a silver dress watch and white linen pocket square to complete this sophisticated look. The navy color complements your skin tone wonderfully and projects confidence and authority.`,
  
  conversation: `Hello! I'm AURA, your AI styling consultant. I can see you're looking fantastic today! I'd love to help you create the perfect look for any occasion. What kind of styling assistance are you looking for? Whether it's a business meeting, special date, formal event, or just everyday confidence - I'm here to make you look and feel amazing!`,
  
  image_generation_fallback: `I would generate a stunning photorealistic image showing: A confident person wearing a perfectly tailored navy single-breasted suit with notched lapels and two buttons. The suit fits impeccably across the shoulders with proper sleeve length. Paired with a crisp white dress shirt, burgundy silk tie with diagonal stripes, silver dress watch, white pocket square, and polished black oxford shoes. Professional studio lighting highlights the rich fabric textures. The person stands confidently with excellent posture against a sophisticated business background.`
};

// Helper function to call Gemini API directly (with mock fallback)
async function callGeminiDirect(prompt, imageData = null, modelType = 'TEXT') {
  
  // Mock mode for testing
  if (MOCK_MODE) {
    console.log('🎭 MOCK MODE: Returning fake Gemini response');
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000)); // Simulate API delay
    
    // Return appropriate mock response based on prompt content
    if (prompt.includes('clothing') || prompt.includes('analyze')) {
      return MOCK_RESPONSES.clothing_analysis;
    } else if (prompt.includes('style') || prompt.includes('outfit') || prompt.includes('visualization')) {
      return MOCK_RESPONSES.style_generation;
    } else if (prompt.includes('AURA') || prompt.includes('conversation')) {
      return MOCK_RESPONSES.conversation;
    } else {
      return MOCK_RESPONSES.style_generation; // Default fallback
    }
  }

  // Real API call (original code)
  try {
    const model = MODELS[modelType] || MODELS.TEXT;
    const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    const parts = [{ text: prompt }];
    
    // Add image if provided
    if (imageData) {
      // Remove data URL prefix if present
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64Data
        }
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
    
  } catch (error) {
    console.error('Direct Gemini API call failed:', error);
    throw error;
  }
}

// Specialized function for image generation using Gemini 2.5 Flash Image Preview
async function callGeminiImageGeneration(prompt) {
  
  // Mock mode for testing
  if (MOCK_MODE) {
    console.log('🎭 MOCK MODE: Returning fake image');
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000)); // Simulate API delay
    
    // Return a random mock image from our pics folder
    const randomImage = MOCK_IMAGES[Math.floor(Math.random() * MOCK_IMAGES.length)];
    
    return {
      imageUrl: randomImage, // Use public folder path directly
      imageData: null, // No base64 data for mock images
      mimeType: 'image/jpeg'
    };
  }

  try {
    const model = MODELS.IMAGE_GENERATION;
    const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini Image API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const candidate = result.candidates?.[0];
    
    if (!candidate) {
      throw new Error('No image generated');
    }

    // Look for image data in the response parts
    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        // Convert base64 to data URL for display
        const mimeType = part.inlineData.mimeType || 'image/png';
        const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
        
        return {
          imageUrl: imageUrl,
          imageData: part.inlineData.data,
          mimeType: mimeType
        };
      } else if (part.text) {
        // Sometimes the model returns text description instead of image
        console.log('Gemini returned text instead of image:', part.text);
      }
    }
    
    throw new Error('No image data found in response');
    
  } catch (error) {
    console.error('Gemini Image Generation failed:', error);
    throw error;
  }
}

export class GeminiService {
  
  static async analyzeClothing(imageData, prompt = null) {
    try {
      const analysisPrompt = prompt || `
        Analyze this clothing image and return a JSON response with this exact structure:
        {
          "type": "suit/shirt/dress/pants/jacket/etc",
          "color": "primary color description",
          "style": "style description (formal/casual/business/etc)",
          "material": "fabric type if visible",
          "confidence": 0.85,
          "suggestions": ["styling suggestion 1", "styling suggestion 2"]
        }
      `;

      const result = await callGeminiDirect(analysisPrompt, imageData);
      
      // Try to parse JSON, fallback to structured response if parsing fails
      try {
        const jsonResult = JSON.parse(result);
        return { success: true, analysis: jsonResult };
      } catch (parseError) {
        // Fallback response if JSON parsing fails
        return {
          success: true,
          analysis: {
            type: 'clothing item',
            color: 'detected',
            style: 'analyzed',
            confidence: 0.75,
            raw_response: result
          }
        };
      }
    } catch (error) {
      console.error('Clothing analysis error:', error);
      throw error;
    }
  }

  static async generateStyleBoard(userPhoto, selectedClothing, occasion, preferences = {}) {
    try {
      const stylePrompt = `
        Create a detailed description for generating a style board image.
        Clothing: ${JSON.stringify(selectedClothing)}
        Occasion: ${occasion}
        Preferences: ${JSON.stringify(preferences)}
        
        Provide a comprehensive style description including:
        - How the clothing should look on the person
        - Color coordination suggestions
        - Accessory recommendations
        - Styling notes and tips
        
        Format as JSON:
        {
          "style_description": "detailed visual description",
          "accessories": ["accessory 1", "accessory 2"],
          "color_palette": ["color1", "color2"],
          "styling_notes": ["tip 1", "tip 2"],
          "confidence": 0.9
        }
      `;

      const result = await callGeminiDirect(stylePrompt, userPhoto);
      
      // For now, return the style description
      return {
        success: true,
        styleBoard: {
          description: result,
          imageUrl: '/demo-assets/generated-style.jpg', // Placeholder
          suggestions: result
        }
      };
    } catch (error) {
      console.error('Style generation error:', error);
      throw error;
    }
  }

  static async refineStyle(previousImage, modification) {
    try {
      const refinePrompt = `
        Based on this style image, apply the following modification: ${modification}
        
        Provide updated styling suggestions in JSON format:
        {
          "updated_description": "new style description",
          "changes_made": ["change 1", "change 2"],
          "styling_notes": ["updated tip 1", "updated tip 2"]
        }
      `;

      const result = await callGeminiDirect(refinePrompt, previousImage);
      
      return {
        success: true,
        refinedStyle: result,
        imageUrl: '/demo-assets/refined-style.jpg' // Placeholder
      };
    } catch (error) {
      console.error('Style refinement error:', error);
      throw error;
    }
  }

  static async getChatResponse(message, context = {}) {
    try {
      const chatPrompt = `
        You are AURA, a friendly AI style consultant.
        
        Context: ${JSON.stringify(context)}
        
        User message: ${message}
        
        Respond in a conversational, helpful manner. Keep it concise but enthusiastic.
      `;

      const result = await callGeminiDirect(chatPrompt);
      
      return {
        success: true,
        response: result.trim(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  // Main method for Mandy conversation with prompt templates
  static async getMandyResponse(prompt, apiType = 'TEXT_ONLY', images = []) {
    try {
      console.log('🤖 Direct Gemini API call:', { prompt: prompt.substring(0, 100) + '...', apiType, imageCount: images.length });
      
      let imageData = null;
      if (apiType === 'TEXT_PLUS_IMAGE' && images.length > 0) {
        imageData = images[0]; // Use first image
      }

      const result = await callGeminiDirect(prompt, imageData);
      console.log('✅ Direct Gemini response received:', result.substring(0, 100) + '...');
      
      return result.trim();
    } catch (error) {
      console.error('❌ Direct Gemini API error:', error);
      throw error;
    }
  }

  // Image generation for outfit visualization using Gemini 2.5 Flash Image Preview
  static async generateOutfitImage(prompt) {
    try {
      console.log('🎨 Generating outfit image with Gemini:', prompt.substring(0, 100) + '...');
      
      const result = await callGeminiImageGeneration(prompt);
      
      return {
        success: true,
        imageUrl: result.imageUrl, // Base64 data URL or public path for mock images
        imageData: result.imageData, // Raw base64 string (null for mock images)
        description: result.description || 'AI-generated outfit visualization',
        prompt: prompt
      };
    } catch (error) {
      console.error('Image generation error:', error);
      
      // In mock mode, still return a mock image even on "error"
      if (MOCK_MODE) {
        console.log('🎭 MOCK MODE: Using fallback mock image');
        const fallbackImage = MOCK_IMAGES[0]; // Use first image as fallback
        
        return {
          success: true,
          imageUrl: fallbackImage,
          imageData: null,
          description: MOCK_RESPONSES.image_generation_fallback,
          prompt: prompt,
          error: null
        };
      }
      
      // Real API fallback to description if image generation fails
      const fallbackPrompt = `
        Create a detailed visual description for this outfit:
        ${prompt}
        
        Describe exactly what someone would see in a photorealistic image.
      `;
      
      const description = await callGeminiDirect(fallbackPrompt);
      
      return {
        success: false,
        imageUrl: null,
        description: description,
        prompt: prompt,
        error: error.message
      };
    }
  }
}