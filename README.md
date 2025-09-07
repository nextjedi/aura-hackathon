# AURA - AI-Powered Virtual Styling Assistant

A 24-hour hackathon project building an AI-powered virtual styling assistant using Google Gemini AI, ElevenLabs TTS, and modern web technologies.

## 🚀 Features

- **Smart Clothing Scan**: Camera-based clothing detection with AI analysis
- **Conversational AI**: Natural language styling consultation
- **Gemini Integration**: Advanced clothing material and style analysis
- **Voice Interface**: Text-to-speech powered by ElevenLabs
- **Style Board Generation**: Personalized styling recommendations
- **Demo Mode**: Perfect for presentations and demonstrations

## 🏗 Architecture

### Frontend
- **React + Vite**: Modern development experience
- **Tailwind CSS**: Utility-first styling with glassmorphism effects
- **Lucide React**: Beautiful icons and UI elements
- **Camera API**: Live video capture and image processing

### Backend
- **Express.js**: RESTful API server with ES modules
- **Winston Logging**: Comprehensive file-based logging
- **Morgan**: HTTP request logging
- **Gemini AI API**: Clothing analysis and style generation
- **ElevenLabs API**: Text-to-speech conversion

## 📝 Logging

The application includes comprehensive logging:

- **Application logs**: `logs/application-YYYY-MM-DD.log`
- **Error logs**: `logs/error.log`
- **API logs**: `logs/api-YYYY-MM-DD.log`
- **Console output**: Color-coded with timestamps

## 🔧 Development

### Setup
```bash
# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install

# Start development servers
npm run dev
```

### Environment Variables
Create `backend/.env`:
```
GEMINI_API_KEY=your_gemini_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
PORT=3001
DEMO_MODE=false
```

### Development Commands
```bash
npm run dev              # Start both servers
npm run dev:frontend     # Frontend only (Vite)
npm run dev:backend      # Backend only (Express)
npm run test:apis        # Test external APIs
```

## 🎯 Development Phases

### Phase 1 (Hours 0-6): Foundation ✅
- [x] Project setup and API testing
- [x] Camera interface with permissions
- [x] Basic UI with glassmorphism design

### Phase 2 (Hours 6-14): Core Features ✅
- [x] Gemini AI clothing analysis
- [x] Text-based conversation flow
- [x] Complete scan → consultation → style board flow

### Phase 3 (Hours 14-20): Advanced Features
- [ ] Voice-to-voice interaction
- [ ] Real-time emotion detection
- [ ] Iterative style refinement

### Phase 4 (Hours 20-24): Demo Polish
- [ ] Demo mode perfection
- [ ] Video recording
- [ ] Deployment

## 🎮 Demo Mode

Press `Ctrl+D` to toggle demo mode for perfect presentations.

## 📊 API Endpoints

- `GET /health` - Health check
- `GET /api/test` - Backend connectivity test  
- `POST /api/gemini/analyze-clothing` - Clothing analysis
- `POST /api/gemini/chat` - Conversational AI
- `POST /api/gemini/generate-style` - Style board generation

## 🚀 Deployment

Frontend deploys to Vercel, backend to your preferred Node.js hosting platform.

---

Built with ❤️ for the hackathon challenge!