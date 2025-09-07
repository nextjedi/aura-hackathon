import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { geminiRouter } from './routes/gemini.js';
import Logger from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Morgan HTTP request logging
const morganFormat = ':method :url :status :response-time ms - :res[content-length]';
app.use(morgan(morganFormat, {
  stream: {
    write: (message) => Logger.http(message.trim())
  }
}));

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/gemini', geminiRouter);

// Health check
app.get('/health', (req, res) => {
  Logger.info('Health check requested');
  res.json({ status: 'AURA is running', timestamp: new Date() });
});

// Test route
app.get('/api/test', (req, res) => {
  Logger.info('Test route accessed');
  res.json({ message: 'Backend is working', demoMode: process.env.DEMO_MODE === 'true' });
});

// Global error handler
app.use((error, req, res, next) => {
  Logger.error(`Global error handler: ${error.message}`, {
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  });
});

app.listen(PORT, () => {
  Logger.info(`🚀 AURA Backend running on port ${PORT}`);
  Logger.info(`📝 Demo Mode: ${process.env.DEMO_MODE === 'true' ? 'ON' : 'OFF'}`);
  Logger.info(`📁 Logs directory: ./logs/`);
});