import Web3 from 'web3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load contract ABI and address
let contractConfig;
try {
  const deploymentPath = path.join(__dirname, 'deployment.json');
  const abiPath = path.join(__dirname, 'artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json');
  
  if (fs.existsSync(deploymentPath) && fs.existsSync(abiPath)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    const contractArtifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    
    contractConfig = {
      address: deployment.contractAddress,
      abi: contractArtifact.abi
    };
    console.log('Contract config loaded:', contractConfig.address);
  } else {
    console.warn('Contract files not found:', { deploymentPath, abiPath });
  }
} catch (error) {
  console.warn('Contract not deployed yet. Deploy first using: npx hardhat run scripts/deploy.js', error.message);
}

class BlockchainService {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
    this.isDevMode = false; // Force real blockchain mode
    this.init();
  }

  async init() {
    try {
      // Initialize Web3
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
      this.web3 = new Web3(rpcUrl);
      console.log('🔗 Web3 initialized with RPC:', rpcUrl);

      // Test connection
      try {
        const blockNumber = await this.web3.eth.getBlockNumber();
        console.log('✅ Blockchain connected successfully. Current block:', blockNumber);
      } catch (connectionError) {
        throw new Error(`Cannot connect to blockchain node at ${rpcUrl}: ${connectionError.message}`);
      }

      // Setup account
      if (process.env.PRIVATE_KEY) {
        const account = this.web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
        this.web3.eth.accounts.wallet.add(account);
        this.account = account.address;
        console.log('✅ Account setup:', this.account);
      } else {
        // Use default hardhat account for development
        const accounts = await this.web3.eth.getAccounts();
        this.account = accounts[0];
        console.log('✅ Using default account:', this.account);
      }

      // Initialize contract with verification
      if (contractConfig) {
        // CRITICAL: Verify the contract actually exists on the blockchain
        const contractCode = await this.web3.eth.getCode(contractConfig.address);
        
        if (contractCode === '0x') {
          console.log('⚠️  Contract address has no code - forcing redeployment...');
          await this.forceContractDeployment();
          
          // Reload contract config after deployment
          const deploymentPath = path.join(__dirname, 'deployment.json');
          const abiPath = path.join(__dirname, 'artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json');
          
          const newDeployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
          const contractArtifact = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
          
          contractConfig = {
            address: newDeployment.contractAddress,
            abi: contractArtifact.abi
          };
          
          console.log('✅ Contract redeployed to:', contractConfig.address);
        }
        
        this.contract = new this.web3.eth.Contract(contractConfig.abi, contractConfig.address);
        console.log('✅ Contract initialized at:', contractConfig.address);
        
        // Test contract connection
        try {
          const contractOwner = await this.contract.methods.owner().call();
          console.log('✅ Contract owner verified:', contractOwner);
        } catch (contractError) {
          // Try alternative method if owner() doesn't work
          try {
            // Check if we can access contract info via a simple call
            const result = await this.web3.eth.call({
              to: contractConfig.address,
              data: '0x' // Empty data just to test contract existence
            });
            console.log('✅ Contract accessible and responding');
          } catch (altError) {
            console.warn('⚠️  Contract method test failed, but contract is deployed:', contractError.message);
          }
        }
      } else {
        throw new Error('Contract configuration not available. Deploy the contract first.');
      }

      console.log('🚀 Blockchain service initialized successfully with real blockchain!');
      
      // Auto-register default institution for certificate registration
      await this.autoRegisterDefaultInstitution();
      
      // Initialize persistence check
      await this.initializePersistenceCheck();
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error.message);
      throw error;
    }
  }

  /**
   * Check blockchain persistence and sync with MongoDB
   */
  async initializePersistenceCheck() {
    try {
      console.log('🔍 Checking blockchain persistence and syncing with MongoDB...');
      
      // This will be implemented to check if certificates in MongoDB
      // exist on blockchain and vice versa
      const syncResult = await this.syncDatabaseWithBlockchain();
      
      if (syncResult.missingOnBlockchain > 0) {
        console.log(`⚠️  Found ${syncResult.missingOnBlockchain} certificates in MongoDB that need blockchain registration`);
        console.log('🔄 Auto-sync will handle this on next certificate operation');
      }
      
      console.log('✅ Persistence check completed');
    } catch (error) {
      console.warn('⚠️  Persistence check failed:', error.message);
    }
  }

  /**
   * Sync database certificates with blockchain
   */
  async syncDatabaseWithBlockchain() {
    try {
      // Import the sync service (dynamic import to avoid circular dependencies)
      const { default: certificateSyncService } = await import('../src/services/certificateSyncService.js');
      
      console.log('🔍 Checking if certificate sync is needed...');
      const syncResult = await certificateSyncService.syncMissingCertificates();
      
      return {
        totalInMongo: 0,
        totalOnBlockchain: 0,
        missingOnBlockchain: syncResult.failed || 0,
        missingInMongo: 0,
        synced: syncResult.synced || 0
      };
    } catch (error) {
      console.warn('⚠️  Certificate sync check failed:', error.message);
      return {
        totalInMongo: 0,
        totalOnBlockchain: 0,
        missingOnBlockchain: 0,
        missingInMongo: 0,
        synced: 0
      };
    }
  }

  /**
   * Force contract deployment when contract address has no code
   */
  async forceContractDeployment() {
    console.log('🔨 Force deploying contract...');
    
    try {
      const { spawn } = await import('child_process');
      
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
          console.log('Deploy:', text.trim());
        });

        deployProcess.stderr.on('data', (data) => {
          console.error('Deploy error:', data.toString());
        });

        deployProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Force deployment completed!');
            resolve(output);
          } else {
            reject(new Error(`Force deployment failed with code ${code}`));
          }
        });

        deployProcess.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('❌ Force deployment failed:', error.message);
      throw error;
    }
  }

  /**
   * Auto-register default institution for certificate registration
   */
  async autoRegisterDefaultInstitution() {
    try {
      console.log('🏢 Checking default institution authorization...');
      
      // Check if current account is already authorized
      const existingInstitution = await this.contract.methods.authorizedInstitutions(this.account).call();
      
      if (existingInstitution && existingInstitution.length > 0) {
        console.log('✅ Account already authorized as institution:', existingInstitution);
        return;
      }
      
      // Register default institution
      const defaultInstitutionCode = 'DEFAULT_INSTITUTION';
      const defaultInstitutionName = 'SIH2025 Default Institution';
      
      console.log('🔨 Registering default institution...');
      
      // Check if institution already exists
      const existingInst = await this.contract.methods.institutions(defaultInstitutionCode).call();
      
      if (existingInst.isActive) {
        console.log('✅ Default institution already exists and is active');
        return;
      }
      
      // Register the institution
      const gasLimit = 500000;
      const gasPrice = await this.web3.eth.getGasPrice();
      
      const tx = await this.contract.methods.registerInstitution(
        defaultInstitutionCode,
        defaultInstitutionName,
        this.account
      ).send({
        from: this.account,
        gas: gasLimit,
        gasPrice: gasPrice
      });
      
      console.log('✅ Default institution registered!');
      console.log(`📍 Institution Code: ${defaultInstitutionCode}`);
      console.log(`🏢 Institution Name: ${defaultInstitutionName}`);
      console.log(`🔑 Authorized Signer: ${this.account}`);
      console.log(`📝 Transaction: ${tx.transactionHash}`);
      
    } catch (error) {
      console.error('❌ Failed to register default institution:', error.message);
      
      // If it's just a "already exists" error, that's fine
      if (error.message.includes('Institution already exists') || 
          error.message.includes('already registered')) {
        console.log('✅ Institution already exists - continuing...');
      } else {
        console.warn('⚠️  Institution registration failed, but continuing...');
      }
    }
  }

  // Mock function for development mode
  generateMockBlockchainResponse(certId) {
    return {
      success: true,
      transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
      blockNumber: Math.floor(Math.random() * 1000000),
      certId: certId,
      documentHash: `0x${crypto.randomBytes(32).toString('hex')}`,
      metadataHash: `0x${crypto.randomBytes(32).toString('hex')}`,
      txHash: `0x${crypto.randomBytes(32).toString('hex')}`
    };
  }

  // Utility function to generate hash
  generateHash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  // Register a single certificate
  async registerCertificate(certificateData) {
    if (!this.contract || !this.account) {
      throw new Error('Blockchain service not properly initialized');
    }

    const {
      studentName,
      rollNumber,
      course,
      grade,
      certId,
      documentBuffer,
      issuedAt
    } = certificateData;

    try {
      // Generate real hashes from actual file data
      const documentHash = this.generateHash(documentBuffer);
      const metadataHash = this.generateHash({
        studentName,
        rollNumber,
        course,
        grade,
        certId,
        issuedAt
      });

      console.log(`📝 Registering certificate ${certId} on blockchain with real file hash...`);
      console.log(`🔍 Document hash: ${documentHash}`);
      console.log(`🔍 Metadata hash: ${metadataHash}`);
      
      // Ensure issuedAt is a positive Unix timestamp (in seconds)
      const currentTime = Math.floor(Date.now() / 1000);
      const issuedAtSeconds = Math.floor(Math.abs(issuedAt) / 1000);
      const validIssuedAt = issuedAtSeconds > 0 ? issuedAtSeconds : currentTime;
      
      console.log(`🕒 Issue timestamp: ${validIssuedAt} (${new Date(validIssuedAt * 1000).toISOString()})`);

      // Prepare transaction for real blockchain
      const tx = this.contract.methods.registerCertificate(
        studentName,
        rollNumber,
        course,
        grade,
        certId,
        documentHash,
        metadataHash,
        validIssuedAt // Use validated positive Unix timestamp
      );

      console.log(`⛽ Estimating gas for transaction...`);
      const gasEstimate = await tx.estimateGas({ from: this.account });
      const gasPrice = await this.web3.eth.getGasPrice();
      
      // Convert BigInt values to numbers for calculations
      const gasEstimateNum = Number(gasEstimate);
      const gasPriceNum = Number(gasPrice);
      const gasLimit = Math.floor(gasEstimateNum * 1.2); // Add 20% buffer
      
      console.log(`🚀 Sending transaction to blockchain...`);
      console.log(`⛽ Gas estimate: ${gasEstimateNum}, Gas price: ${gasPriceNum}, Gas limit: ${gasLimit}`);
      
      const result = await tx.send({
        from: this.account,
        gas: gasLimit,
        gasPrice: gasPriceNum
      });

      console.log(`✅ Certificate registered! Transaction hash: ${result.transactionHash}`);
      
      return {
        success: true,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        certId: certId,
        documentHash: documentHash,
        metadataHash: metadataHash,
        txHash: result.transactionHash
      };
    } catch (error) {
      console.error('❌ Error registering certificate:', error);
      throw new Error(`Failed to register certificate: ${error.message}`);
    }
  }

  // Register multiple certificates in batch
  async registerCertificatesBatch(certificatesData) {
    if (!this.contract || !this.account) {
      throw new Error('Blockchain service not properly initialized');
    }

    console.log(`📚 Batch registering ${certificatesData.length} certificates on blockchain...`);

    try {
      const studentNames = [];
      const rollNumbers = [];
      const courses = [];
      const grades = [];
      const certIds = [];
      const documentHashes = [];
      const metadataHashes = [];
      const issuedAts = [];

      // Process each certificate
      for (const cert of certificatesData) {
        const documentHash = this.generateHash(cert.documentBuffer);
        const metadataHash = this.generateHash({
          studentName: cert.studentName,
          rollNumber: cert.rollNumber,
          course: cert.course,
          grade: cert.grade,
          certId: cert.certId,
          issuedAt: cert.issuedAt
        });

        studentNames.push(cert.studentName);
        rollNumbers.push(cert.rollNumber);
        courses.push(cert.course);
        grades.push(cert.grade);
        certIds.push(cert.certId);
        documentHashes.push(documentHash);
        metadataHashes.push(metadataHash);
        issuedAts.push(Math.floor(cert.issuedAt / 1000));
      }

      // Prepare transaction
      const tx = this.contract.methods.registerCertificatesBatch(
        studentNames,
        rollNumbers,
        courses,
        grades,
        certIds,
        documentHashes,
        metadataHashes,
        issuedAts
      );

      const gasEstimate = await tx.estimateGas({ from: this.account });
      const gasPrice = await this.web3.eth.getGasPrice();

      // Convert BigInt values for calculations
      const gasEstimateNum = Number(gasEstimate);
      const gasPriceNum = Number(gasPrice);
      const gasLimit = Math.floor(gasEstimateNum * 1.2); // Add 20% buffer

      const result = await tx.send({
        from: this.account,
        gas: gasLimit,
        gasPrice: gasPriceNum
      });

      return {
        success: true,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        processedCount: certIds.length,
        certIds: certIds
      };
    } catch (error) {
      console.error('Error registering certificates batch:', error);
      throw new Error(`Failed to register certificates batch: ${error.message}`);
    }
  }

  // Verify a certificate
  async verifyCertificate(certId, documentBuffer) {
    if (!this.contract) {
      throw new Error('Blockchain service not properly initialized');
    }

    console.log(`🔍 Verifying certificate ${certId} on blockchain...`);

    try {
      // First, verify the contract still exists
      const contractCode = await this.web3.eth.getCode(this.contract.options.address);
      if (contractCode === '0x') {
        console.error('⚠️  Contract no longer exists at address:', this.contract.options.address);
        throw new Error('Contract not found on blockchain - may need redeployment');
      }

      let documentHash = null;
      
      // If fileBuffer is provided, generate hash; otherwise, skip file verification
      if (documentBuffer) {
        documentHash = this.generateHash(documentBuffer);
        console.log(`🔍 Document hash for verification: ${documentHash}`);
        
        // Verify with document hash
        const result = await this.contract.methods.verifyCertificate(certId, documentHash).call();
        
        return {
          success: true,
          isValid: result,
          certId: certId,
          documentHash: documentHash,
          fileVerified: true
        };
      } else {
        // Just check if certificate exists on blockchain without file verification
        console.log(`🔍 Verifying certificate existence only (no file provided)`);
        
        try {
          const certificate = await this.contract.methods.getCertificate(certId).call();
          
          return {
            success: true,
            isValid: certificate && certificate[11], // isValid field from contract
            certId: certId,
            documentHash: null,
            fileVerified: false,
            certificate: certificate
          };
        } catch (getCertError) {
          return {
            success: false,
            isValid: false,
            error: 'Certificate not found on blockchain'
          };
        }
      }
    } catch (error) {
      console.error('Error verifying certificate:', error);
      return {
        success: false,
        isValid: false,
        error: error.message
      };
    }
  }

  // Get certificate details
  async getCertificate(certId) {
    if (!this.contract) {
      throw new Error('Blockchain service not properly initialized');
    }

    console.log(`📋 Retrieving certificate ${certId} from blockchain...`);

    try {
      const result = await this.contract.methods.getCertificate(certId).call();
      
      return {
        success: true,
        certificate: {
          studentName: result[0],
          rollNumber: result[1],
          institution: result[2],
          course: result[3],
          grade: result[4],
          certId: result[5],
          documentHash: result[6],
          metadataHash: result[7],
          issuedAt: new Date(parseInt(result[8]) * 1000),
          registeredAt: new Date(parseInt(result[9]) * 1000),
          registeredBy: result[10],
          isValid: result[11]
        }
      };
    } catch (error) {
      console.error('Error getting certificate:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if certificate exists
  async certificateExists(certId) {
    if (!this.contract) {
      throw new Error('Blockchain service not properly initialized');
    }

    try {
      const exists = await this.contract.methods.certificateExists(certId).call();
      return { success: true, exists };
    } catch (error) {
      console.error('Error checking certificate existence:', error);
      return { success: false, exists: false, error: error.message };
    }
  }

  // Register institution (admin only)
  async registerInstitution(institutionCode, name, authorizedSigner) {
    if (!this.contract || !this.account) {
      throw new Error('Blockchain service not properly initialized');
    }

    try {
      const tx = this.contract.methods.registerInstitution(
        institutionCode,
        name,
        authorizedSigner
      );

      const gasEstimate = await tx.estimateGas({ from: this.account });
      const gasPrice = await this.web3.eth.getGasPrice();

      // Convert BigInt values for calculations
      const gasEstimateNum = Number(gasEstimate);
      const gasPriceNum = Number(gasPrice);
      const gasLimit = Math.floor(gasEstimateNum * 1.2);

      const result = await tx.send({
        from: this.account,
        gas: gasLimit,
        gasPrice: gasPriceNum
      });

      return {
        success: true,
        transactionHash: result.transactionHash,
        institutionCode: institutionCode
      };
    } catch (error) {
      console.error('Error registering institution:', error);
      throw new Error(`Failed to register institution: ${error.message}`);
    }
  }

  // Get institution details
  async getInstitution(institutionCode) {
    if (!this.contract) {
      throw new Error('Blockchain service not properly initialized');
    }

    try {
      const result = await this.contract.methods.getInstitution(institutionCode).call();
      
      return {
        success: true,
        institution: {
          name: result[0],
          code: result[1],
          authorizedSigner: result[2],
          isActive: result[3],
          registeredAt: new Date(parseInt(result[4]) * 1000)
        }
      };
    } catch (error) {
      console.error('Error getting institution:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Blacklist certificate (admin only)
  async blacklistCertificate(certId) {
    if (!this.contract || !this.account) {
      throw new Error('Blockchain service not properly initialized');
    }

    try {
      const tx = this.contract.methods.blacklistCertificate(certId);

      const gasEstimate = await tx.estimateGas({ from: this.account });
      const gasPrice = await this.web3.eth.getGasPrice();

      // Convert BigInt values for calculations
      const gasEstimateNum = Number(gasEstimate);
      const gasPriceNum = Number(gasPrice);
      const gasLimit = Math.floor(gasEstimateNum * 1.2);

      const result = await tx.send({
        from: this.account,
        gas: gasLimit,
        gasPrice: gasPriceNum
      });

      return {
        success: true,
        transactionHash: result.transactionHash,
        certId: certId
      };
    } catch (error) {
      console.error('Error blacklisting certificate:', error);
      throw new Error(`Failed to blacklist certificate: ${error.message}`);
    }
  }

  // Check if certificate is blacklisted
  async isBlacklisted(certId) {
    if (!this.contract) {
      throw new Error('Blockchain service not properly initialized');
    }

    try {
      const isBlacklisted = await this.contract.methods.isBlacklisted(certId).call();
      return { success: true, isBlacklisted };
    } catch (error) {
      console.error('Error checking blacklist status:', error);
      return { success: false, isBlacklisted: false, error: error.message };
    }
  }

  // Get blockchain network info
  async getNetworkInfo() {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }

    try {
      const networkId = await this.web3.eth.net.getId();
      const blockNumber = await this.web3.eth.getBlockNumber();
      const gasPrice = await this.web3.eth.getGasPrice();

      return {
        success: true,
        networkId: networkId.toString(),
        blockNumber: blockNumber.toString(),
        gasPrice: gasPrice.toString(),
        account: this.account,
        contractAddress: contractConfig?.address
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
const blockchainService = new BlockchainService();

export default blockchainService;
