import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import blockchainRoutes from './routes/blockchain.routes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Authenticity Validator Backend API is running.',
    version: '1.0.0',
    blockchain: 'Enabled',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint
app.get('/debug', (req, res) => {
  res.json({ 
    message: 'Debug endpoint',
    env: {
      BLOCKCHAIN_RPC_URL: process.env.BLOCKCHAIN_RPC_URL,
      PRIVATE_KEY: process.env.PRIVATE_KEY ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT
    },
    paths: {
      cwd: process.cwd(),
      __dirname: import.meta.url
    }
  });
});

// Blockchain routes
app.use('/api/blockchain', blockchainRoutes);

// TODO: Add other routes (auth, AI, etc.)

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Blockchain service enabled`);
});
