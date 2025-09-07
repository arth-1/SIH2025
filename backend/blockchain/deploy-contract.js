#!/usr/bin/env node

/**
 * Manual Contract Deployment Script
 * Use this to manually deploy the contract if auto-deployment fails
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔨 Manual Contract Deployment');
console.log('=' .repeat(40));

async function deployContract() {
    try {
        console.log('📋 Starting contract deployment...');
        
        return new Promise((resolve, reject) => {
            const deployProcess = spawn('npx', ['hardhat', 'run', 'scripts/deploy.js', '--network', 'localhost'], {
                cwd: __dirname,
                stdio: 'inherit',
                shell: true
            });

            deployProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('\n✅ Contract deployed successfully!');
                    
                    // Check deployment file
                    const deploymentPath = path.join(__dirname, 'deployment.json');
                    if (fs.existsSync(deploymentPath)) {
                        const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
                        console.log('📋 Deployment Details:');
                        console.log(`   📍 Address: ${deployment.contractAddress}`);
                        console.log(`   🌐 Network: ${deployment.network}`);
                        console.log(`   📅 Time: ${deployment.deployedAt}`);
                    }
                    
                    resolve();
                } else {
                    reject(new Error(`Deployment failed with code ${code}`));
                }
            });

            deployProcess.on('error', (error) => {
                reject(error);
            });
        });
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        throw error;
    }
}

// Run deployment
deployContract().catch((error) => {
    console.error('💥 Critical deployment error:', error);
    process.exit(1);
});
