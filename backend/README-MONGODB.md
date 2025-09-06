# Certificate Validator - MongoDB Integration

This document explains the MongoDB integration with the blockchain certificate verification system.

## Features

### 🔗 Blockchain + MongoDB Integration
- **Smart Contract**: Immutable certificate storage on blockchain
- **MongoDB**: Comprehensive certificate metadata and search functionality
- **Document Integrity**: SHA-256 hashing with tamper detection
- **Watermarking**: Metadata-based watermark verification

### 📋 API Endpoints

#### Certificate Registration
```
POST /api/certificates/register
Content-Type: multipart/form-data

Body:
- certificateFile: PDF/Image file
- studentName: string
- courseName: string
- institutionName: string
- issueDate: string (YYYY-MM-DD)
- institutionId: string (optional)
```

#### Certificate Verification
```
POST /api/certificates/verify
Content-Type: multipart/form-data

Body:
- certificateId: string (required)
- certificateFile: PDF/Image file (optional, for integrity check)
```

#### Institution Certificates
```
GET /api/certificates/institution/:institutionId
```

#### Search Certificates
```
GET /api/certificates/search?q=searchTerm
```

#### Statistics
```
GET /api/certificates/stats
```

## Database Schema

### Certificate Model
```javascript
{
  certificateId: String,        // Unique blockchain ID
  studentName: String,
  courseName: String,
  institutionName: String,
  issueDate: Date,
  blockchainHash: String,       // Transaction hash
  documentHash: String,         // SHA-256 of document
  isVerified: Boolean,
  verificationDate: Date,
  verificationCount: Number,
  lastVerifiedAt: Date,
  institutionId: String,
  watermarkData: Object,        // Watermark metadata
  metadata: {
    originalFileName: String,
    fileSize: Number,
    uploadedAt: Date
  }
}
```

## Setup Instructions

### 1. Environment Configuration
Create `.env` file:
```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/certificate_validator
MONGO_URI=mongodb://localhost:27017/certificate_validator

# Blockchain
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=your_private_key_here

# Authentication
JWT_SECRET=your_jwt_secret_here

# Server
PORT=5000
NODE_ENV=development
```

### 2. MongoDB Setup
```bash
# Install MongoDB locally or use MongoDB Atlas
# For local installation:
mongod --dbpath /path/to/your/db
```

### 3. Blockchain Setup
```bash
# Start Hardhat local network
npx hardhat node

# Deploy smart contract
npx hardhat run blockchain/scripts/deploy.js --network localhost
```

### 4. Start Backend
```bash
npm install
npm run dev
```

## Service Layer

### CertificateService Class
The `CertificateService` provides integrated blockchain + MongoDB operations:

- `registerCertificate()`: Registers on blockchain and stores in MongoDB
- `verifyCertificate()`: Verifies against blockchain and checks document integrity
- `getInstitutionCertificates()`: Retrieves certificates for an institution
- `searchCertificates()`: Full-text search across certificate data
- `getCertificateStats()`: Analytics and statistics

## Document Processing

### Hash Generation
- Uses SHA-256 for document fingerprinting
- Enables tamper detection
- Consistent across different uploads of same document

### Watermarking
- Metadata-based watermark embedding
- Verification against stored watermark data
- Additional layer of authenticity

## Testing

### Integration Test
Run the integration test to verify MongoDB + Blockchain connectivity:
```bash
node test/integration-test.js
```

### API Testing with cURL

#### Register Certificate
```bash
curl -X POST http://localhost:5000/api/certificates/register \
  -F "certificateFile=@/path/to/certificate.pdf" \
  -F "studentName=John Doe" \
  -F "courseName=Computer Science" \
  -F "institutionName=Tech University" \
  -F "issueDate=2024-01-15"
```

#### Verify Certificate
```bash
curl -X POST http://localhost:5000/api/certificates/verify \
  -F "certificateId=CERT_123456789" \
  -F "certificateFile=@/path/to/certificate.pdf"
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Blockchain    │
│                 │    │                 │    │                 │
│ - Upload Form   │◄──►│ - Certificate   │◄──►│ - Smart         │
│ - Verification  │    │   Service       │    │   Contract      │
│ - Search        │    │ - File          │    │ - Immutable     │
│ - Dashboard     │    │   Processing    │    │   Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │    MongoDB      │
                       │                 │
                       │ - Certificate   │
                       │   Metadata      │
                       │ - Search Index  │
                       │ - Analytics     │
                       └─────────────────┘
```

## Error Handling

The system provides comprehensive error handling:
- **Blockchain Errors**: Network connectivity, gas issues, contract errors
- **Database Errors**: Connection issues, validation errors, duplicate keys
- **File Errors**: Invalid formats, size limits, corruption
- **Validation Errors**: Missing fields, invalid data formats

## Security Features

- **Document Integrity**: SHA-256 hashing prevents tampering
- **Blockchain Immutability**: Certificate data cannot be altered
- **File Validation**: Only PDF and image files accepted
- **Size Limits**: 10MB maximum file size
- **MongoDB Indexing**: Optimized queries with proper indexing

## Performance Considerations

- **File Processing**: Efficient buffer handling for large documents
- **Database Queries**: Indexed fields for fast searches
- **Blockchain Calls**: Optimized Web3 interactions
- **Caching**: Verification results cached in MongoDB
- **Pagination**: Large result sets handled properly

## Production Deployment

### MongoDB Atlas
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/certificate_validator
```

### Blockchain Networks
- **Testnet**: Polygon Mumbai, Ethereum Sepolia
- **Mainnet**: Polygon, Ethereum (with proper gas management)

### Security
- Environment variables for all secrets
- HTTPS enforcement
- Rate limiting
- Input validation and sanitization
