import { spawn } from 'child_process';
import Web3 from 'web3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Automatic Contract Deployment System
 * This script ensures the contract is always deployed and ready
 */
export class AutoDeployment {
    constructor() {
        this.web3 = new Web3('http://127.0.0.1:8545');
        this.deploymentPath = path.join(__dirname, 'deployment.json');
        this.contractArtifactPath = path.join(__dirname, 'artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json');
    }

    /**
     * Check if blockchain is running
     */
    async isBlockchainRunning() {
        try {
            await this.web3.eth.getBlockNumber();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if contract is deployed and working
     */
    async isContractDeployed() {
        try {
            if (!fs.existsSync(this.deploymentPath)) {
                console.log('📋 No deployment.json found');
                return false;
            }

            const deployment = JSON.parse(fs.readFileSync(this.deploymentPath, 'utf8'));
            const contractAddress = deployment.contractAddress;

            // Check if address has contract code
            const code = await this.web3.eth.getCode(contractAddress);
            if (code === '0x') {
                console.log('⚠️  Contract address has no code');
                return false;
            }

            // Additional check: try to call a contract method
            if (!fs.existsSync(this.contractArtifactPath)) {
                console.log('⚠️  Contract artifact not found');
                return false;
            }

            const contractArtifact = JSON.parse(fs.readFileSync(this.contractArtifactPath, 'utf8'));
            const contract = new this.web3.eth.Contract(contractArtifact.abi, contractAddress);
            
            // Try to call owner() method to verify contract is working
            try {
                await contract.methods.owner().call();
                console.log('✅ Contract verified and working at:', contractAddress);
                return true;
            } catch (methodError) {
                console.log('⚠️  Contract exists but methods not accessible');
                return false;
            }

        } catch (error) {
            console.log('❌ Contract check failed:', error.message);
            return false;
        }
    }

    /**
     * Start blockchain node if not running
     */
    async startBlockchain() {
        console.log('🚀 Starting Hardhat blockchain node...');
        
        return new Promise((resolve, reject) => {
            const hardhatProcess = spawn('npx', ['hardhat', 'node'], {
                cwd: __dirname,
                stdio: 'pipe',
                shell: true
            });

            let nodeReady = false;

            hardhatProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(output);
                
                if (output.includes('Started HTTP and WebSocket JSON-RPC server')) {
                    nodeReady = true;
                    console.log('✅ Blockchain node is ready!');
                    setTimeout(() => resolve(hardhatProcess), 2000); // Give it 2 seconds to fully initialize
                }
            });

            hardhatProcess.stderr.on('data', (data) => {
                console.error('Blockchain error:', data.toString());
            });

            hardhatProcess.on('error', (error) => {
                reject(error);
            });

            // Timeout after 30 seconds
            setTimeout(() => {
                if (!nodeReady) {
                    reject(new Error('Blockchain node failed to start within 30 seconds'));
                }
            }, 30000);
        });
    }

    /**
     * Deploy the contract automatically
     */
    async deployContract() {
        console.log('🔨 Deploying CertificateRegistry contract automatically...');
        
        return new Promise((resolve, reject) => {
            const deployProcess = spawn('npx', ['hardhat', 'run', 'scripts/deploy.js', '--network', 'localhost'], {
                cwd: __dirname,
                stdio: 'pipe',
                shell: true
            });

            let output = '';

            deployProcess.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                console.log(text);
            });

            deployProcess.stderr.on('data', (data) => {
                console.error('Deploy error:', data.toString());
            });

            deployProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Contract deployed successfully!');
                    resolve(output);
                } else {
                    reject(new Error(`Deployment failed with code ${code}`));
                }
            });

            deployProcess.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Main initialization function with loop prevention
     */
    async initialize() {
        console.log('🔄 Auto-deployment system initializing...');
        
        // Check if we're already in a deployment process
        const lockFile = path.join(__dirname, '.deployment-lock');
        if (fs.existsSync(lockFile)) {
            console.log('🔒 Deployment already in progress, skipping...');
            return true;
        }
        
        try {
            // Create lock file to prevent concurrent deployments
            fs.writeFileSync(lockFile, Date.now().toString());
            
            // Step 1: Check if blockchain is running
            let isRunning = await this.isBlockchainRunning();
            
            if (!isRunning) {
                console.log('⚠️  Blockchain not running, starting automatically...');
                await this.startBlockchain();
                
                // Wait a bit more and check again
                await new Promise(resolve => setTimeout(resolve, 3000));
                isRunning = await this.isBlockchainRunning();
                
                if (!isRunning) {
                    throw new Error('Failed to start blockchain node');
                }
            } else {
                console.log('✅ Blockchain is already running');
            }

            // Step 2: Check if contract is deployed
            const isDeployed = await this.isContractDeployed();
            
            if (!isDeployed) {
                console.log('🔨 Contract not deployed, deploying automatically...');
                await this.deployContract();
                
                // Verify deployment
                const deployedSuccessfully = await this.isContractDeployed();
                if (!deployedSuccessfully) {
                    throw new Error('Contract deployment verification failed');
                }
            } else {
                console.log('✅ Contract is already deployed and working');
            }

            console.log('🎉 Auto-deployment completed successfully!');
            console.log('📋 Certificate system is ready for automatic registration');
            
            // Remove lock file
            if (fs.existsSync(lockFile)) {
                fs.unlinkSync(lockFile);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Auto-deployment failed:', error.message);
            
            // Clean up lock file
            if (fs.existsSync(lockFile)) {
                fs.unlinkSync(lockFile);
            }
            
            throw error;
        }
    }
}

// Export for use in other modules
export default AutoDeployment;
