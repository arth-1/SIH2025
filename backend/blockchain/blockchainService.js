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
    this.init();
  }

  async init() {
    try {
      // Initialize Web3
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
      this.web3 = new Web3(rpcUrl);
      console.log('Web3 initialized with RPC:', rpcUrl);

      // Setup account
      if (process.env.PRIVATE_KEY) {
        const account = this.web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
        this.web3.eth.accounts.wallet.add(account);
        this.account = account.address;
        console.log('Account setup:', this.account);
      }

      // Initialize contract
      if (contractConfig) {
        this.contract = new this.web3.eth.Contract(contractConfig.abi, contractConfig.address);
        console.log('Contract initialized at:', contractConfig.address);
      } else {
        console.warn('Contract config not available');
      }

      console.log('Blockchain service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
    }
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

    try {
      const {
        studentName,
        rollNumber,
        course,
        grade,
        certId,
        documentBuffer, // Buffer or base64 string of the document
        issuedAt
      } = certificateData;

      // Generate hashes
      const documentHash = this.generateHash(documentBuffer);
      const metadataHash = this.generateHash({
        studentName,
        rollNumber,
        course,
        grade,
        certId,
        issuedAt
      });

      // Prepare transaction
      const tx = this.contract.methods.registerCertificate(
        studentName,
        rollNumber,
        course,
        grade,
        certId,
        documentHash,
        metadataHash,
        Math.floor(issuedAt / 1000) // Convert to Unix timestamp
      );

      const gasEstimate = await tx.estimateGas({ from: this.account });
      const gasPrice = await this.web3.eth.getGasPrice();

      const result = await tx.send({
        from: this.account,
        gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
        gasPrice: gasPrice
      });

      return {
        success: true,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        certId: certId,
        documentHash: documentHash,
        metadataHash: metadataHash
      };
    } catch (error) {
      console.error('Error registering certificate:', error);
      throw new Error(`Failed to register certificate: ${error.message}`);
    }
  }

  // Register multiple certificates in batch
  async registerCertificatesBatch(certificatesData) {
    if (!this.contract || !this.account) {
      throw new Error('Blockchain service not properly initialized');
    }

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

      const result = await tx.send({
        from: this.account,
        gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
        gasPrice: gasPrice
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

    try {
      const documentHash = this.generateHash(documentBuffer);
      
      const result = await this.contract.methods.verifyCertificate(certId, documentHash).call();
      
      return {
        success: true,
        isValid: result,
        certId: certId,
        documentHash: documentHash
      };
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

      const result = await tx.send({
        from: this.account,
        gas: Math.floor(gasEstimate * 1.2),
        gasPrice: gasPrice
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

      const result = await tx.send({
        from: this.account,
        gas: Math.floor(gasEstimate * 1.2),
        gasPrice: gasPrice
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
