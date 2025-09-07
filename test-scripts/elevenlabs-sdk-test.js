#!/usr/bin/env node

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const logFile = 'test-scripts/elevenlabs-sdk-test-log.txt';

function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp}: ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logLine);
}

async function testElevenLabsSDK() {
  try {
    // Clear previous log
    fs.writeFileSync(logFile, '');
    
    log('🔊 Starting ElevenLabs SDK Test');
    
    const apiKey = process.env.ELEVENLABS_API_KEY;
    log(`🔑 API Key found: ${apiKey ? 'Yes' : 'No'}`);
    log(`🔑 Key starts with: ${apiKey ? apiKey.substring(0, 10) + '...' : 'N/A'}`);
    
    if (!apiKey) {
      log('❌ No API key found');
      return false;
    }
    
    log('🔧 Initializing ElevenLabs client');
    const elevenlabs = new ElevenLabsClient({
      apiKey: apiKey,
    });
    
    const text = "Hello! This is AURA, your AI styling assistant. I'm excited to help you look amazing today!";
    log(`📝 Text to convert: "${text}"`);
    
    // Use George voice (a common default voice ID)
    const voiceId = 'JBFqnCBsd6RMkjVDRZzb';
    log(`🎭 Using voice ID: ${voiceId} (George)`);
    
    log('🎯 Converting text to speech...');
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text: text,
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128',
    });
    
    log('📦 Audio generated, saving to file...');
    
    // Convert the audio stream to buffer and save
    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    
    const outputPath = 'test-scripts/elevenlabs-sdk-output.mp3';
    fs.writeFileSync(outputPath, audioBuffer);
    
    log('✅ SUCCESS! Audio generated successfully');
    log(`💾 Saved to: ${outputPath}`);
    log(`📊 File size: ${(audioBuffer.length / 1024).toFixed(1)} KB`);
    log('🎵 Play the MP3 file to hear the generated speech!');
    
    // Note: We can't use the play() function in Node.js, it's for browsers
    log('ℹ️  Note: Auto-play not available in Node.js environment');
    
    return true;
    
  } catch (error) {
    log(`❌ Error: ${error.message}`);
    if (error.response) {
      log(`HTTP Status: ${error.response.status}`);
      log(`Response: ${JSON.stringify(error.response.data)}`);
    }
    log(`Stack: ${error.stack}`);
    return false;
  }
}

testElevenLabsSDK()
  .then(success => {
    log(success ? '✅ Test successful' : '❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`💥 Unexpected error: ${error.message}`);
    process.exit(1);
  });