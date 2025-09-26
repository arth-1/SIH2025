import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Test certificate verification with email notification
async function testCompleteVerification() {
  try {
    console.log('🧪 Testing complete certificate verification with email...');
    
    const formData = new FormData();
    
    // Use a test certificate ID and add email
    formData.append('email', 'maadhavagarwal39@gmail.com');
    
    // You can add a test file if available
    // const testFile = fs.readFileSync('./test-certificate.pdf');
    // formData.append('certificateFile', testFile, 'test-certificate.pdf');
    
    console.log('📤 Sending verification request...');
    
    const response = await fetch('http://localhost:5000/api/enhanced-certificates/verify/CERT_TEST_123', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    console.log('📄 Verification Response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.emailSent) {
      console.log('✅ Email notification sent successfully!');
    } else if (result.emailSent === false) {
      console.log('❌ Email notification failed to send');
    } else {
      console.log('ℹ️  No email was configured for this verification');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompleteVerification();