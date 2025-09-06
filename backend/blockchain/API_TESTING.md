# Blockchain API Testing

## Test the blockchain functionality

### 1. Check Network Info
```bash
curl http://localhost:5000/api/blockchain/network/info
```

### 2. Register an Institution (Admin Only)
```bash
curl -X POST http://localhost:5000/api/blockchain/institutions/register \
  -H "Content-Type: application/json" \
  -d '{
    "institutionCode": "MIT001",
    "name": "Massachusetts Institute of Technology",
    "authorizedSigner": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  }'
```

### 3. Get Institution Details
```bash
curl http://localhost:5000/api/blockchain/institutions/MIT001
```

### 4. Register a Certificate
```bash
# Create a test file first
echo "Test Certificate Content" > test-cert.txt

# Register certificate with file upload
curl -X POST http://localhost:5000/api/blockchain/certificates/register \
  -F "certificate=@test-cert.txt" \
  -F "studentName=John Doe" \
  -F "rollNumber=2021001" \
  -F "course=Computer Science" \
  -F "grade=A" \
  -F "certId=CS2024001"
```

### 5. Verify Certificate
```bash
curl -X POST http://localhost:5000/api/blockchain/certificates/verify/CS2024001 \
  -F "certificate=@test-cert.txt"
```

### 6. Get Certificate Details
```bash
curl http://localhost:5000/api/blockchain/certificates/CS2024001
```

### 7. Check if Certificate Exists
```bash
curl http://localhost:5000/api/blockchain/certificates/CS2024001/exists
```

### 8. Register Batch Certificates
```bash
curl -X POST http://localhost:5000/api/blockchain/certificates/batch \
  -H "Content-Type: application/json" \
  -d '{
    "certificates": [
      {
        "studentName": "Jane Smith",
        "rollNumber": "2021002",
        "course": "Mathematics", 
        "grade": "B",
        "certId": "MATH2024001",
        "documentBase64": "VGVzdCBDZXJ0aWZpY2F0ZSBDb250ZW50",
        "issuedAt": "2024-06-15T10:00:00Z"
      }
    ]
  }'
```

## Testing with PowerShell (Windows)

### Network Info
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/blockchain/network/info" -Method GET
```

### Register Institution
```powershell
$body = @{
    institutionCode = "MIT001"
    name = "Massachusetts Institute of Technology"
    authorizedSigner = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/blockchain/institutions/register" -Method POST -Body $body -ContentType "application/json"
```

### Get Institution
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/blockchain/institutions/MIT001" -Method GET
```

## Expected Responses

### Network Info Response
```json
{
  "success": true,
  "network": {
    "networkId": "31337",
    "blockNumber": "1",
    "gasPrice": "875000000",
    "account": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "contractAddress": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
  }
}
```

### Institution Registration Response
```json
{
  "success": true,
  "message": "Institution registered successfully",
  "data": {
    "transactionHash": "0x...",
    "institutionCode": "MIT001"
  }
}
```

### Certificate Registration Response
```json
{
  "success": true,
  "message": "Certificate registered successfully",
  "data": {
    "transactionHash": "0x...",
    "blockNumber": 2,
    "certId": "CS2024001",
    "documentHash": "abc123...",
    "metadataHash": "def456..."
  }
}
```

### Certificate Verification Response
```json
{
  "success": true,
  "isValid": true,
  "certId": "CS2024001",
  "message": "Certificate is valid",
  "certificate": {
    "studentName": "John Doe",
    "rollNumber": "2021001",
    "institution": "MIT001",
    "course": "Computer Science",
    "grade": "A",
    "isValid": true
  }
}
```
