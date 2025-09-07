#!/usr/bin/env node

/**
 * 🚀 SIH2025 Certificate System - One-Command Startup
 * 
 * This script automatically:
 * 1. Starts blockchain node if needed
 * 2. Deploys smart contract if needed  
 * 3. Starts backend server
 * 4. Everything automatic - no manual steps!
 */

console.log('🎯 SIH2025 AUTOMATIC STARTUP');
console.log('='.repeat(50));
console.log('🔄 Starting complete certificate management system...');
console.log('📋 Blockchain + Smart Contract + Backend Server');
console.log('🤖 Everything will be deployed automatically!');
console.log('='.repeat(50));

// Import and start the server (which includes auto-deployment)
import('./src/index.js').catch((error) => {
    console.error('❌ Startup failed:', error.message);
    process.exit(1);
});
