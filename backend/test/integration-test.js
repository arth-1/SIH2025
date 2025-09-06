import certificateService from '../src/services/certificateService.js';
import connectDB from '../src/config/db.js';
import fs from 'fs';
import path from 'path';

// Test MongoDB integration with blockchain
async function testIntegration() {
  console.log('🧪 Testing MongoDB + Blockchain Integration...\n');
  
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ MongoDB connection successful');
    
    // Test certificate registration (mock data since we don't have a real file)
    const mockCertificateData = {
      studentName: 'John Doe',
      courseName: 'Advanced Web Development',
      institutionName: 'Tech University',
      issueDate: '2024-01-15',
      originalFileName: 'test-certificate.pdf'
    };
    
    // Create mock file buffer
    const mockFileBuffer = Buffer.from('Mock PDF content for testing');
    
    console.log('📝 Testing certificate registration...');
    const registrationResult = await certificateService.registerCertificate(
      mockCertificateData,
      mockFileBuffer,
      'test-institution-001'
    );
    
    if (registrationResult.success) {
      console.log('✅ Certificate registration successful!');
      console.log(`   Certificate ID: ${registrationResult.certificateId}`);
      console.log(`   Transaction Hash: ${registrationResult.transactionHash}`);
      console.log(`   Document Hash: ${registrationResult.documentHash}`);
      
      // Test certificate verification
      console.log('\n🔍 Testing certificate verification...');
      const verificationResult = await certificateService.verifyCertificate(
        registrationResult.certificateId,
        mockFileBuffer
      );
      
      if (verificationResult.success) {
        console.log('✅ Certificate verification successful!');
        console.log(`   Student: ${verificationResult.certificate.studentName}`);
        console.log(`   Course: ${verificationResult.certificate.courseName}`);
        console.log(`   Institution: ${verificationResult.certificate.institutionName}`);
        console.log(`   Document Integrity: ${verificationResult.documentIntegrity.verified ? 'VERIFIED' : 'TAMPERED'}`);
      } else {
        console.log('❌ Certificate verification failed:', verificationResult.error);
      }
      
      // Test statistics
      console.log('\n📊 Testing statistics...');
      const statsResult = await certificateService.getCertificateStats();
      if (statsResult.success) {
        console.log('✅ Statistics retrieved successfully!');
        console.log(`   Total Certificates: ${statsResult.stats.total}`);
        console.log(`   Verified Certificates: ${statsResult.stats.verified}`);
      }
      
    } else {
      console.log('❌ Certificate registration failed:', registrationResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🏁 Integration test completed!');
}

// Run the test
testIntegration();
