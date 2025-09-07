import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from backend/.env
dotenv.config({ path: './backend/.env' });

export async function testElevenLabs() {
  console.log('🔊 Testing ElevenLabs API...');
  
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    throw new Error('ELEVENLABS_API_KEY not set in environment variables');
  }

  const testText = "Hello! I'm AURA, your AI style consultant. Let me help you look amazing today.";
  
  try {
    // Validate API key format
    if (apiKey.length < 10) {
      throw new Error('ElevenLabs API key appears to be invalid (too short)');
    }

    // TODO: Implement actual ElevenLabs API call
    // This is a placeholder - replace with real API call
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }

    const voices = await response.json();
    console.log(`  📝 Found ${voices.voices?.length || 0} available voices`);
    console.log('  📝 Test text prepared');
    console.log('  ✅ ElevenLabs API connection verified');
    
    return { success: true, message: 'ElevenLabs API working', voiceCount: voices.voices?.length };
    
  } catch (error) {
    throw new Error(`ElevenLabs API test failed: ${error.message}`);
  }
}