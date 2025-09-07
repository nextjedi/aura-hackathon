#!/usr/bin/env node

import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const logFile = 'test-scripts/elevenlabs-test-log.txt';

function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp}: ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logLine);
}

async function testElevenLabsTTS() {
  try {
    // Clear previous log
    fs.writeFileSync(logFile, '');
    
    log('🔊 Starting ElevenLabs TTS Test');
    
    const apiKey = process.env.ELEVENLABS_API_KEY;
    log(`🔑 API Key found: ${apiKey ? 'Yes' : 'No'}`);
    log(`🔑 Key starts with: ${apiKey ? apiKey.substring(0, 10) + '...' : 'N/A'}`);
    
    if (!apiKey) {
      log('❌ No API key found');
      return false;
    }
    
    const text = "Hello! This is AURA, your AI styling assistant. I'm excited to help you look amazing today!";
    log(`📝 Text to convert: "${text}"`);
    
    // Use a default voice ID (Rachel - a common default voice)
    const selectedVoiceId = "21m00Tcm4TlvDq8ikWAM";
    log(`🎭 Using default voice ID: ${selectedVoiceId} (Rachel)`);
    log('ℹ️  Note: Skipping voice list fetch due to API key permissions');
    
    log('🎯 Generating speech...');
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });
    
    if (!ttsResponse.ok) {
      log(`❌ TTS generation failed: ${ttsResponse.status} ${ttsResponse.statusText}`);
      const errorText = await ttsResponse.text();
      log(`Error details: ${errorText}`);
      return false;
    }
    
    log('💾 Saving audio file...');
    const audioBuffer = await ttsResponse.arrayBuffer();
    const outputPath = 'test-scripts/elevenlabs-hello-world.mp3';
    
    fs.writeFileSync(outputPath, Buffer.from(audioBuffer));
    
    log('✅ SUCCESS! Audio generated successfully');
    log(`💾 Saved to: ${outputPath}`);
    log(`📊 File size: ${(audioBuffer.byteLength / 1024).toFixed(1)} KB`);
    log('🎵 Play the MP3 file to hear the generated speech!');
    
    return true;
    
  } catch (error) {
    log(`❌ Error: ${error.message}`);
    log(`Stack: ${error.stack}`);
    return false;
  }
}

testElevenLabsTTS()
  .then(success => {
    log(success ? '✅ Test successful' : '❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`💥 Unexpected error: ${error.message}`);
    process.exit(1);
  });