#!/usr/bin/env node

import { testGemini } from './test-gemini.js';
import { testElevenLabs } from './test-elevenlabs.js';
import { testSpeechAPI } from './test-speech.js';
import { testEmotionDetection } from './test-emotion.js';

console.log('🧪 Starting AURA API Tests...\n');

async function runAllTests() {
  const tests = [
    { name: 'Gemini API', fn: testGemini },
    { name: 'ElevenLabs API', fn: testElevenLabs },
    { name: 'Web Speech API', fn: testSpeechAPI },
    { name: 'Emotion Detection', fn: testEmotionDetection }
  ];

  const results = [];
  
  for (const test of tests) {
    console.log(`Testing ${test.name}...`);
    try {
      await test.fn();
      console.log(`✅ ${test.name} - PASSED\n`);
      results.push({ name: test.name, status: 'PASSED' });
    } catch (error) {
      console.error(`❌ ${test.name} - FAILED`);
      console.error(error.message + '\n');
      results.push({ name: test.name, status: 'FAILED', error: error.message });
    }
  }

  console.log('\n📊 Test Summary:');
  console.table(results);
}

runAllTests();