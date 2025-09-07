# AURA API Testing Suite

Complete testing suite for all AURA APIs and voice interactions. These tests validate each API independently before integration into the main application.

## 🚀 Quick Start

```bash
# Start test server (required for browser-based tests)
cd test-scripts && py -m http.server 8080

# Then open browser to:
# http://localhost:8080/hybrid-conversation-test.html
```

## 📋 Test Overview

| Test | Type | Purpose | Status |
|------|------|---------|---------|
| **Gemini Text + Image** | Node.js | Text analysis + Image generation | ✅ Working |
| **ElevenLabs TTS** | Node.js | Text-to-speech conversion | ✅ Working |
| **Speech Recognition** | Browser | Voice input (Web Speech API) | ✅ Working |
| **Emotion Detection** | Browser | Real-time facial emotion analysis | ✅ Working |
| **Hybrid Conversation** | Browser | Full voice conversation flow | ✅ Working |

## 🧪 Individual API Tests

### 1. Gemini AI (Text + Image Generation)

**File:** `simple-gemini-test.js`

```bash
node simple-gemini-test.js
```

**What it tests:**
- ✅ Basic text generation with gemini-1.5-flash
- ✅ Image generation with gemini-2.5-flash-image-preview
- ✅ API key validation
- ✅ Error handling and fallbacks

**Expected output:**
- Text response for styling questions
- PNG image file (~200KB) saved locally
- Comprehensive logging to console

**Code reference:**
- Uses `@google/genai` SDK
- Model: `gemini-2.5-flash-image-preview`
- Saves images as base64 → Buffer → PNG file

### 2. ElevenLabs Text-to-Speech

**File:** `elevenlabs-sdk-test.js`

```bash
node elevenlabs-sdk-test.js
```

**What it tests:**
- ✅ TTS conversion using official SDK
- ✅ Voice ID compatibility
- ✅ Audio streaming and file saving
- ✅ API key validation

**Expected output:**
- MP3 audio file with AURA's voice
- File size information
- Stream processing confirmation

**Code reference:**
- Uses `@elevenlabs/elevenlabs-js` SDK
- Voice: George (JBFqnCBsd6RMkjVDRZzb)
- Model: eleven_multilingual_v2
- Output: mp3_44100_128

### 3. Speech-to-Text Recognition

**File:** `speech-to-text-test.html`  
**URL:** http://localhost:8080/speech-to-text-test.html

**What it tests:**
- ✅ Web Speech API initialization
- ✅ Real-time speech recognition
- ✅ Interim vs final results
- ✅ Microphone permissions and error handling

**Features:**
- Continuous listening mode
- Real-time transcription display
- Visual feedback (pulsing microphone)
- Comprehensive error messages

**Code reference:**
- Uses browser's native `webkitSpeechRecognition`
- Settings: `continuous: true`, `interimResults: true`
- Language: en-US

### 4. Emotion Detection

**File:** `emotion-detection-test.html`  
**URL:** http://localhost:8080/emotion-detection-test.html

**What it tests:**
- ✅ Camera access and permissions
- ✅ face-api.js model loading
- ✅ Real-time emotion detection
- ✅ Visual feedback and overlays

**Features:**
- 7 emotions: Happy, Sad, Angry, Fearful, Disgusted, Surprised, Neutral
- Real-time percentage bars
- Dominant emotion highlighting
- Face bounding box overlay

**Code reference:**
- Uses face-api.js with TinyFaceDetector + FaceExpressionNet
- Detection interval: 100ms (10fps)
- Models loaded from CDN: https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/

### 5. Hybrid Voice Conversation System

**File:** `hybrid-conversation-test.html`  
**URL:** http://localhost:8080/hybrid-conversation-test.html

**What it tests:**
- ✅ Complete voice-to-voice interaction
- ✅ Speech recognition → Text processing → TTS response
- ✅ Multiple voice personalities and settings
- ✅ Emotional sound effects

**Features:**
- **Input:** Web Speech API (free)
- **Output:** ElevenLabs TTS (premium quality)
- 4 voice options with real-time settings
- Conversation history
- Sound effect testing

**Code reference:**
- Combines Web Speech API + ElevenLabs TTS
- Voice settings: stability, clarity, style
- Real-time audio playback using HTML5 Audio API

## 🔧 API Configuration

### Required Environment Variables

Add to `backend/.env`:

```bash
GEMINI_API_KEY=your_gemini_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
```

### API Endpoints Used

**Gemini:**
- Text: `gemini-1.5-flash` model
- Images: `gemini-2.5-flash-image-preview` model
- SDK: `@google/genai`

**ElevenLabs:**
- Endpoint: `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
- SDK: `@elevenlabs/elevenlabs-js`
- Model: `eleven_multilingual_v2`

## 🎭 Voice Settings Guide

### ElevenLabs Voice Parameters

**Stability (0.0 - 1.0):**
- 0.0: Wild, unpredictable variations
- 0.5: Balanced (recommended)  
- 1.0: Consistent, monotone

**Clarity/Similarity Boost (0.0 - 1.0):**
- 0.0: Natural, softer
- 0.5: Balanced clarity
- 1.0: Crisp, clear pronunciation

**Style Exaggeration (0.0 - 1.0):**
- 0.0: Neutral delivery
- 0.5: Moderate expression
- 1.0: Highly expressive

### Recommended Settings by Mood

| Mood | Stability | Clarity | Style | Use Case |
|------|-----------|---------|-------|----------|
| **Professional** | 0.8 | 0.9 | 0.2 | Business advice |
| **Friendly** | 0.5 | 0.7 | 0.6 | General conversation |
| **Excited** | 0.3 | 0.8 | 0.8 | Positive reactions |
| **Thoughtful** | 0.8 | 0.6 | 0.2 | Contemplative responses |

## 🚦 Test Server Setup

**Start server:**
```bash
cd test-scripts
py -m http.server 8080
```

**Available URLs:**
- http://localhost:8080/speech-to-text-test.html
- http://localhost:8080/emotion-detection-test.html  
- http://localhost:8080/hybrid-conversation-test.html

**Why localhost is required:**
- Browser security requires HTTPS or localhost for camera/microphone access
- Direct file:// URLs will be blocked by Chrome

## 🐛 Troubleshooting

### Common Issues

**"API key missing permissions"**
- ElevenLabs free tier may lack `voices_read` permission
- Solution: Tests use hardcoded voice IDs instead

**"Camera/microphone blocked"**
- Browser security settings
- Solution: Grant permissions when prompted, use localhost

**"Models loading slowly"**
- face-api.js downloads models from CDN on first use
- Solution: Wait for model loading completion

**"Audio not playing"**
- Browser autoplay policies
- Solution: User interaction required before audio playback

### Debug Commands

```bash
# Check if APIs are accessible
curl -H "xi-api-key: $ELEVENLABS_API_KEY" https://api.elevenlabs.io/v1/voices

# Test Gemini with simple request
node -e "console.log('Testing Gemini...'); process.exit(0)"

# Verify test server
curl http://localhost:8080/speech-to-text-test.html
```

## 📈 Integration Notes

These tests validate APIs before integration into main AURA application:

1. **Phase 1**: Individual API validation (✅ Complete)
2. **Phase 2**: Integration into React components
3. **Phase 3**: Full conversation flow with Gemini analysis
4. **Phase 4**: Production optimization

**Next Steps:**
- Integrate working APIs into main React app
- Add error handling and retry logic
- Implement conversation state management
- Add demo mode for presentations

## 🔗 Code References

**Main files to reference for integration:**
- `simple-gemini-test.js:33-39` - GoogleGenAI initialization
- `elevenlabs-sdk-test.js:23-29` - ElevenLabs client setup
- `hybrid-conversation-test.html:200-220` - Speech recognition setup
- `emotion-detection-test.html:394-438` - Face detection loop

**Key dependencies:**
- `@google/genai` - Official Gemini SDK
- `@elevenlabs/elevenlabs-js` - Official ElevenLabs SDK  
- `face-api.js` - Browser emotion detection
- Native Web Speech API - Speech recognition