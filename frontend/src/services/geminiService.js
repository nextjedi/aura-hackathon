const API_BASE = 'http://localhost:3001/api';

export class GeminiService {
  
  static async analyzeClothing(imageData, prompt = null) {
    try {
      const response = await fetch(`${API_BASE}/gemini/analyze-clothing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          prompt: prompt || 'Analyze this clothing item and identify the type, color, style, and material. Return JSON format.'
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Clothing analysis error:', error);
      throw error;
    }
  }

  static async generateStyleBoard(userPhoto, selectedClothing, occasion, preferences = {}) {
    try {
      const response = await fetch(`${API_BASE}/gemini/generate-style`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPhoto,
          clothing: selectedClothing,
          occasion,
          preferences,
          prompt: `Create a style board image showing a person wearing ${selectedClothing.type} in ${selectedClothing.color} for ${occasion}. Include styling suggestions and accessories.`
        })
      });

      if (!response.ok) {
        throw new Error(`Style generation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Style generation error:', error);
      throw error;
    }
  }

  static async refineStyle(previousImage, modification) {
    try {
      const response = await fetch(`${API_BASE}/gemini/refine-style`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseImage: previousImage,
          modification,
          prompt: `Modify this style image: ${modification}`
        })
      });

      if (!response.ok) {
        throw new Error(`Style refinement failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Style refinement error:', error);
      throw error;
    }
  }

  static async getChatResponse(message, context = {}) {
    try {
      const response = await fetch(`${API_BASE}/gemini/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          systemPrompt: 'You are AURA, a friendly AI style consultant. Keep responses conversational, helpful, and enthusiastic about fashion.'
        })
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }
}