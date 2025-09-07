import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from backend/.env
dotenv.config({ path: './backend/.env' });

export async function testGemini() {
  console.log('🔮 Testing Gemini API...');
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    throw new Error('GEMINI_API_KEY not set in environment variables');
  }

  // Test prompt for clothing analysis
  const testPrompt = `Analyze this image and identify any clothing items. Return a JSON response with the following structure:
  {
    "clothing_items": [
      {
        "type": "suit/shirt/pants/jacket/etc",
        "color": "color description",
        "style": "style description",
        "confidence": 0.95
      }
    ]
  }`;

  try {
    // Test with a simple text prompt first (no image required)
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    const testData = {
      contents: [{
        parts: [{
          text: "Analyze this clothing description: 'Navy blue business suit, tailored fit, wool material' and return JSON with type, color, style, and confidence fields."
        }]
      }]
    };

    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('  ✅ Gemini API connection verified');
    console.log('  📝 Test response received');
    console.log('  📝 Ready for image analysis');
    
    return { success: true, message: 'Gemini API working', response: result };
    
  } catch (error) {
    throw new Error(`Gemini API test failed: ${error.message}`);
  }
}