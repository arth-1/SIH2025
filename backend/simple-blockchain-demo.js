// 🎯 SIMPLE BLOCKCHAIN DEMO - No Complex Dependencies
// This shows you EXACTLY what the Ethereum blockchain is doing for your hackathon

import express from 'express';
import cors from 'cors';
import { Web3 } from 'web3';

const app = express();
app.use(cors());
app.use(express.json());

// 📡 Connect to our LOCAL blockchain (not real Ethereum!)
const web3 = new Web3('http://localhost:8545');

// 🏛️ Our Smart Contract Address (deployed locally)
const contractAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';

// 📜 Contract ABI (tells us how to talk to the smart contract)
const contractABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "_certId", "type": "string"},
      {"internalType": "string", "name": "_studentName", "type": "string"},
      {"internalType": "string", "name": "_institution", "type": "string"},
      {"internalType": "string", "name": "_dataHash", "type": "string"}
    ],
    "name": "registerCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "_certId", "type": "string"}],
    "name": "verifyCertificate",
    "outputs": [
      {"internalType": "bool", "name": "isValid", "type": "bool"},
      {"internalType": "string", "name": "studentName", "type": "string"},
      {"internalType": "string", "name": "institution", "type": "string"},
      {"internalType": "string", "name": "dataHash", "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// 🤝 Create contract instance
const contract = new web3.eth.Contract(contractABI, contractAddress);

// 🚀 API ENDPOINTS FOR YOUR HACKATHON DEMO

// 📊 Show blockchain network info
app.get('/api/demo/network', async (req, res) => {
  try {
    const networkId = await web3.eth.getChainId();
    const accounts = await web3.eth.getAccounts();
    const blockNumber = await web3.eth.getBlockNumber();
    
    res.json({
      success: true,
      message: "✅ Connected to LOCAL blockchain (not real Ethereum!)",
      network: {
        networkId: networkId.toString(),
        contractAddress,
        currentBlock: blockNumber.toString(),
        testAccounts: accounts.length,
        explanation: "This is a local development blockchain - no real money involved!"
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      hint: "Make sure to run: npx hardhat node"
    });
  }
});

// 📝 Register a certificate on blockchain
app.post('/api/demo/register', async (req, res) => {
  try {
    const { certId, studentName, institution, course } = req.body;
    
    // 🔐 Create a hash of the certificate data
    const dataToHash = `${certId}-${studentName}-${institution}-${course}`;
    const dataHash = web3.utils.keccak256(dataToHash);
    
    // 👤 Use first account as the registrar
    const accounts = await web3.eth.getAccounts();
    const fromAccount = accounts[0];
    
    console.log(`🔗 Registering certificate ${certId} on blockchain...`);
    
    // 📤 Send transaction to blockchain
    const receipt = await contract.methods
      .registerCertificate(certId, studentName, institution, dataHash)
      .send({ from: fromAccount, gas: 300000 });
    
    res.json({
      success: true,
      message: "🎉 Certificate registered on blockchain!",
      data: {
        certId,
        studentName,
        institution,
        dataHash,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        explanation: "This certificate is now IMMUTABLE - cannot be changed or faked!"
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🔍 Verify a certificate
app.get('/api/demo/verify/:certId', async (req, res) => {
  try {
    const { certId } = req.params;
    
    console.log(`🔍 Verifying certificate ${certId}...`);
    
    // 📞 Call the smart contract
    const result = await contract.methods.verifyCertificate(certId).call();
    
    if (result.isValid) {
      res.json({
        success: true,
        message: "✅ Certificate is AUTHENTIC!",
        certificate: {
          certId,
          studentName: result.studentName,
          institution: result.institution,
          dataHash: result.dataHash,
          status: "VERIFIED",
          explanation: "This certificate exists on the blockchain and hasn't been tampered with!"
        }
      });
    } else {
      res.json({
        success: false,
        message: "❌ Certificate NOT FOUND on blockchain",
        explanation: "This certificate was never registered or the ID is wrong"
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🎭 Demo endpoint - Test tamper detection
app.post('/api/demo/tamper-test', async (req, res) => {
  try {
    const { originalData, tamperedData } = req.body;
    
    // 🔐 Generate hashes
    const originalHash = web3.utils.keccak256(originalData);
    const tamperedHash = web3.utils.keccak256(tamperedData);
    
    const isTampered = originalHash !== tamperedHash;
    
    res.json({
      success: true,
      tamperDetection: {
        originalHash,
        tamperedHash,
        isTampered,
        message: isTampered 
          ? "🚨 TAMPERING DETECTED! Data has been modified!" 
          : "✅ Data is authentic - no tampering detected"
      },
      explanation: "Blockchain uses cryptographic hashes to detect ANY changes to certificate data"
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📚 Help endpoint - Explain what this does
app.get('/api/demo/help', (req, res) => {
  res.json({
    title: "🎯 SIH 2025 - Certificate Authentication Blockchain",
    problem: "Fake certificates are a major issue in academics",
    solution: "Use blockchain to create tamper-proof certificate records",
    howItWorks: [
      "1. 🏛️ Institution registers authentic certificates on blockchain",
      "2. 🔐 Each certificate gets a unique cryptographic hash",
      "3. 🔗 Hash is stored permanently on blockchain (cannot be changed)",
      "4. 🔍 Anyone can verify certificate authenticity instantly",
      "5. 🚨 Any tampering is immediately detected"
    ],
    whyBlockchain: [
      "✅ IMMUTABLE - Records cannot be changed once written",
      "✅ DECENTRALIZED - No single point of failure", 
      "✅ TRANSPARENT - Anyone can verify authenticity",
      "✅ CRYPTOGRAPHIC - Uses advanced math to prevent forgery"
    ],
    localBlockchain: {
      message: "We use a LOCAL blockchain for development",
      benefits: [
        "💰 FREE - No real money required",
        "⚡ FAST - Instant transactions for testing",
        "🔒 SAFE - Completely isolated from real networks",
        "🛠️ FLEXIBLE - Perfect for hackathon development"
      ]
    },
    demoEndpoints: [
      "GET  /api/demo/network      - Show blockchain connection",
      "POST /api/demo/register     - Register new certificate", 
      "GET  /api/demo/verify/:id   - Verify certificate authenticity",
      "POST /api/demo/tamper-test  - Demonstrate tamper detection",
      "GET  /api/demo/help         - This help message"
    ]
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n🎯 SIH 2025 - CERTIFICATE BLOCKCHAIN DEMO');
  console.log('==========================================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('\n📡 BLOCKCHAIN CONNECTION:');
  console.log('   Local Network: http://localhost:8545');
  console.log('   Contract: 0x5fbdb2315678afecb367f032d93f642f64180aa3');
  console.log('\n🚀 API ENDPOINTS:');
  console.log('   GET  /api/demo/help         - Explains everything');
  console.log('   GET  /api/demo/network      - Blockchain status');
  console.log('   POST /api/demo/register     - Register certificate');
  console.log('   GET  /api/demo/verify/:id   - Verify certificate');
  console.log('\n💡 WHY ETHEREUM BLOCKCHAIN?');
  console.log('   ✅ Perfect for immutable certificate records');
  console.log('   ✅ Prevents forgery through cryptographic hashes');
  console.log('   ✅ Works across institutions without central authority');
  console.log('   ✅ Industry standard for authenticity validation');
  console.log('\n🎪 FOR HACKATHON DEMO:');
  console.log('   1. Show live blockchain connection');
  console.log('   2. Register a certificate');
  console.log('   3. Verify it works');
  console.log('   4. Show tamper detection');
  console.log('   5. Explain why blockchain solves the problem');
  console.log('\n🔥 This is EXACTLY what judges want to see!');
});

export default app;
