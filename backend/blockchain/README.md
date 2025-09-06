# Certificate Authenticity Validator - Blockchain Module

This module provides blockchain-based certificate authentication for the Authenticity Validator system.

## Features

- **Smart Contract**: Solidity contract for storing certificate hashes and metadata
- **Certificate Registration**: Register single or batch certificates on blockchain
- **Certificate Verification**: Verify certificate authenticity against blockchain records
- **Institution Management**: Register and manage educational institutions
- **Blacklist Support**: Admin ability to blacklist fraudulent certificates
- **Hash Verification**: Document integrity checking using SHA-256 hashes

## Architecture

### Smart Contract (`CertificateRegistry.sol`)
- Stores certificate metadata and document hashes
- Supports batch operations for bulk uploads
- Institution authorization system
- Admin controls for blacklisting
- Event logging for transparency

### Backend Service (`blockchainService.js`)
- Web3 integration for blockchain interaction
- Hash generation for documents and metadata
- Transaction management
- Error handling and logging

### API Endpoints (`blockchain.controller.js`)
- RESTful API for all blockchain operations
- File upload handling with multer
- Input validation and sanitization
- Comprehensive error responses

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Environment Variables
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Fill in the required values:
- `PRIVATE_KEY`: Your wallet private key (without 0x prefix)
- `BLOCKCHAIN_RPC_URL`: RPC endpoint for your chosen network
- API keys for contract verification (optional)

### 3. Compile Smart Contract
```bash
cd blockchain
npm run compile
```

### 4. Deploy Contract

**For local development:**
```bash
# Start local blockchain
npm run node

# Deploy to localhost (in another terminal)
npm run deploy:local
```

**For testnet (Mumbai):**
```bash
npm run deploy:mumbai
```

**For mainnet (Polygon):**
```bash
npm run deploy:polygon
```

### 5. Start Backend Server
```bash
cd ..
npm run dev
```

## API Endpoints

### Certificate Operations

#### Register Single Certificate
```http
POST /api/blockchain/certificates/register
Content-Type: multipart/form-data

Fields:
- certificate: PDF/image file
- studentName: string
- rollNumber: string
- course: string
- grade: string
- certId: string (unique)
- issuedAt: ISO date string (optional)
```

#### Register Batch Certificates
```http
POST /api/blockchain/certificates/batch
Content-Type: application/json

{
  "certificates": [
    {
      "studentName": "John Doe",
      "rollNumber": "2021001",
      "course": "Computer Science",
      "grade": "A",
      "certId": "CS2024001",
      "documentBase64": "base64_encoded_document",
      "issuedAt": "2024-06-15T10:00:00Z"
    }
  ]
}
```

#### Verify Certificate
```http
POST /api/blockchain/certificates/verify/{certId}
Content-Type: multipart/form-data

Fields:
- certificate: PDF/image file to verify
```

This blockchain module provides a robust foundation for certificate authentication, ensuring data integrity and preventing document forgery through cryptographic verification.
