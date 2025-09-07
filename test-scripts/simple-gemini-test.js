#!/usr/bin/env node

import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const logFile = 'test-scripts/gemini-test-log.txt';

function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp}: ${message}\n`;
  console.log(message);
  fs.appendFileSync(logFile, logLine);
}

async function testGemini() {
  try {
    // Clear previous log
    fs.writeFileSync(logFile, '');
    
    log('🎨 Starting Gemini Test');
    
    const apiKey = process.env.GEMINI_API_KEY;
    log(`🔑 API Key found: ${apiKey ? 'Yes' : 'No'}`);
    
    if (!apiKey) {
      log('❌ No API key found');
      return false;
    }
    
    log('🔧 Initializing GoogleGenAI');
    const genAI = new GoogleGenAI({ apiKey: apiKey });
    
    log('📝 Testing basic text generation first');
    const textResponse = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: "Say hello in a friendly way",
    });
    
    if (textResponse?.candidates?.[0]?.content?.parts?.[0]?.text) {
      log('✅ Text generation works!');
      log(`Response: ${textResponse.candidates[0].content.parts[0].text}`);
    } else {
      log('❌ Text generation failed');
      log(`Response: ${JSON.stringify(textResponse)}`);
    }
    
    log('🎨 Now testing image generation');
    const imageResponse = await genAI.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: "Create a simple red circle on white background",
    });
    
    if (imageResponse?.candidates?.[0]?.content?.parts) {
      log(`✅ Image response received with ${imageResponse.candidates[0].content.parts.length} parts`);
      
      for (let i = 0; i < imageResponse.candidates[0].content.parts.length; i++) {
        const part = imageResponse.candidates[0].content.parts[i];
        if (part.inlineData) {
          log(`🖼️  Found image data in part ${i}`);
          const buffer = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync('test-scripts/simple-test-image.png', buffer);
          log(`💾 Saved ${buffer.length} bytes to simple-test-image.png`);
        } else if (part.text) {
          log(`📝 Found text in part ${i}: ${part.text}`);
        }
      }
    } else {
      log('❌ Image generation failed');
      log(`Response: ${JSON.stringify(imageResponse)}`);
    }
    
    log('🎉 Test completed');
    return true;
    
  } catch (error) {
    log(`❌ Error: ${error.message}`);
    log(`Stack: ${error.stack}`);
    return false;
  }
}

testGemini()
  .then(success => {
    log(success ? '✅ Test successful' : '❌ Test failed');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log(`💥 Unexpected error: ${error.message}`);
    process.exit(1);
  });