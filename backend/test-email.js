import emailService from './src/services/emailService.js';

console.log('Testing email service...');

const testResult = {
  success: true,
  documentCheck: true,
  blockchainVerification: true,
  integrityCheck: true,
  signatureVerification: {
    signatureCount: 1,
    isReal: false,
    confidence: 58.77,
    highestConfidenceScore: 0.5877,
    signatureResults: [{
      signatureIndex: 0,
      verificationStatus: 'forged',
      confidenceScore: 0.5877
    }]
  },
  certificateData: {
    studentName: 'Test Student',
    courseName: 'Computer Science',
    institutionName: 'Test University',
    issueDate: '2023-06-15'
  },
  transactionHash: '0x123abc...',
  verificationDate: new Date().toISOString()
};

// Test email connection
console.log('1. Testing email connection...');
try {
  const connectionResult = await emailService.testConnection();
  console.log('Connection result:', connectionResult);
} catch (error) {
  console.error('Connection test failed:', error);
}

// Test sending verification result (you can replace with your actual email)
const testEmail = 'maadhavagarwal39@gmail.com'; // Replace with actual email for testing
console.log(`2. Testing verification result email to ${testEmail}...`);
try {
  const emailResult = await emailService.sendVerificationResult(testEmail, testResult, 'CERT_TEST_123');
  console.log('Email result:', emailResult);
} catch (error) {
  console.error('Email sending failed:', error);
}

console.log('Test completed.');