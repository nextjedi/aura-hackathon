import express from 'express';
import dotenv from 'dotenv';
import Logger from '../utils/logger.js';

dotenv.config();
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Helper function to call Gemini API
async function callGemini(prompt, imageData = null) {
  try {
    const model = imageData ? 'gemini-1.5-flash' : 'gemini-1.5-flash';
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
    console.error('Gemini API call failed:', error);
    throw error;
  }
}

// Analyze clothing from image
router.post('/analyze-clothing', async (req, res) => {
  try {
    const { image, prompt } = req.body;
    
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

    const result = await callGemini(analysisPrompt, image);
    
    // Try to parse JSON, fallback to structured response if parsing fails
    try {
      const jsonResult = JSON.parse(result);
      res.json({ success: true, analysis: jsonResult });
    } catch (parseError) {
      // Fallback response if JSON parsing fails
      res.json({
        success: true,
        analysis: {
          type: 'clothing item',
          color: 'detected',
          style: 'analyzed',
          confidence: 0.75,
          raw_response: result
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate style board
router.post('/generate-style', async (req, res) => {
  try {
    const { userPhoto, clothing, occasion, preferences, prompt } = req.body;
    
    const stylePrompt = `
      Create a detailed description for generating a style board image.
      Clothing: ${JSON.stringify(clothing)}
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

    const result = await callGemini(stylePrompt, userPhoto);
    
    // For now, return the style description
    // TODO: Integrate with actual image generation
    res.json({
      success: true,
      styleBoard: {
        description: result,
        imageUrl: '/demo-assets/generated-style.jpg', // Placeholder
        suggestions: result
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Chat with AURA
router.post('/chat', async (req, res) => {
  try {
    const { message, context, systemPrompt } = req.body;
    
    const chatPrompt = `
      ${systemPrompt || 'You are AURA, a friendly AI style consultant.'}
      
      Context: ${JSON.stringify(context)}
      
      User message: ${message}
      
      Respond in a conversational, helpful manner. Keep it concise but enthusiastic.
    `;

    const result = await callGemini(chatPrompt);
    
    res.json({
      success: true,
      response: result.trim(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Refine style based on user feedback
router.post('/refine-style', async (req, res) => {
  try {
    const { baseImage, modification, prompt } = req.body;
    
    const refinePrompt = `
      Based on this style image, apply the following modification: ${modification}
      
      Provide updated styling suggestions in JSON format:
      {
        "updated_description": "new style description",
        "changes_made": ["change 1", "change 2"],
        "styling_notes": ["updated tip 1", "updated tip 2"]
      }
    `;

    const result = await callGemini(refinePrompt, baseImage);
    
    res.json({
      success: true,
      refinedStyle: result,
      imageUrl: '/demo-assets/refined-style.jpg' // Placeholder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { router as geminiRouter };