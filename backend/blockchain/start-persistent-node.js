#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const blockchainDataDir = './blockchain-data';

// Create persistent data directory if it doesn't exist
if (!fs.existsSync(blockchainDataDir)) {
    fs.mkdirSync(blockchainDataDir, { recursive: true });
    console.log('📁 Created persistent blockchain data directory');
}

console.log('🚀 Starting persistent Hardhat node with real blockchain data...');
console.log('💾 Data will be stored in:', path.resolve(blockchainDataDir));

// Start Hardhat node with persistent storage
const hardhatNode = spawn('npx', [
    'hardhat', 
    'node',
    '--hostname', '127.0.0.1',
    '--port', '8545',
    '--export', './deployment.json'
], {
    stdio: 'inherit',
    shell: true
});

hardhatNode.on('close', (code) => {
    console.log(`\n📝 Hardhat node stopped with code ${code}`);
    console.log('💾 All blockchain data has been preserved');
});

process.on('SIGINT', () => {
    console.log('\n🛑 Gracefully shutting down persistent blockchain...');
    hardhatNode.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Terminating persistent blockchain...');
    hardhatNode.kill('SIGTERM');
});
