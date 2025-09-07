import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import AutoDeployment from '../blockchain/auto-deploy.js';

// Import routes
import blockchainRoutes from './routes/blockchain.routes.js';
import certificateRoutes from './routes/certificateRoute.js';
import employerRoutes from './routes/employerRoute.js';
import instituteRoutes from './routes/instituteRouter.js';
import syncRoutes from './routes/syncRoute.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'SIH2025 Authenticity Validator Backend API is running.',
    version: '1.0.0',
    blockchain: 'Enabled',
    features: ['Certificate Verification', 'Blockchain Storage', 'AI Integration'],
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    services: {
      blockchain: 'Active',
      database: 'Connected',
      fileStorage: 'Ready'
    },
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

// API Routes
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/institutes', instituteRoutes);
app.use('/api/sync', syncRoutes);

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

// Auto-deployment and server startup
async function startServer() {
  try {
    console.log('🔄 Starting SIH2025 Certificate System...');
    
    // Step 1: Automatic blockchain and contract deployment with loop protection
    console.log('🚀 Initializing auto-deployment system...');
    const autoDeployment = new AutoDeployment();
    await autoDeployment.initialize();
    
    // Step 2: Start the server
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 SIH2025 CERTIFICATE SYSTEM READY');
      console.log('='.repeat(60));
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔗 Blockchain service: ACTIVE`);
      console.log(`📊 Database integration: READY`);
      console.log(`🔨 Contract deployment: AUTOMATIC`);
      console.log(`✅ Certificate registration: AUTOMATIC`);
      console.log('='.repeat(60));
      console.log('📋 Upload certificates → Automatically registered on blockchain!');
      console.log('� Verify certificates → Automatic blockchain verification!');
      console.log('💾 Everything persists across restarts!');
      console.log('='.repeat(60));
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure no other services are using port 8545');
    console.log('2. Check if you have the latest Hardhat installed');
    console.log('3. Verify your blockchain directory structure');
    process.exit(1);
  }
}

// Start the server with auto-deployment
startServer();

export default app;
