import Certificate from '../models/certificateModel.js';
import blockchainService from '../../blockchain/blockchainService.js';
import AIService from './aiService.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CertificateService {
  constructor() {
    this.blockchainService = blockchainService; // Use the singleton instance
    this.aiService = new AIService();
    this.uploadsDir = path.join(__dirname, '../../uploads/documents');
    this.tempDir = path.join(__dirname, '../../temp');
    
    // Ensure directories exist
    [this.uploadsDir, this.tempDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Configuration from environment variables
    this.config = {
      fraudThreshold: parseFloat(process.env.FRAUD_THRESHOLD) || 0.5,
      signatureThreshold: parseFloat(process.env.SIGNATURE_THRESHOLD) || 0.5,
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB default
      allowedExtensions: (process.env.ALLOWED_EXTENSIONS || 'jpg,jpeg,png,pdf').split(',')
    };
  }

  /**
   * Process and store a single certificate with AI analysis
   */
  async processCertificate(fileBuffer, fileName, institutionCode, metadata = {}) {
    try {
      console.log('🔄 Starting certificate processing pipeline...');
      
      // Save uploaded file temporarily
      const tempFilePath = path.join(this.tempDir, `temp_${Date.now()}_${fileName}`);
      fs.writeFileSync(tempFilePath, fileBuffer);
      
      // Step 1: AI Processing (OCR + Signature Verification)
      console.log('🤖 Running AI analysis...');
      const aiResults = await this.aiService.processCertificate(
        tempFilePath, 
        metadata.studentId, 
        institutionCode
      );
      
      // Step 2: Generate unique certificate ID if not extracted
      const certificateId = aiResults.extractedData.certificate_id || 
                           this.generateCertificateId(institutionCode);
      
      // Step 3: Save file permanently
      const permanentFilePath = path.join(this.uploadsDir, `${certificateId}_${fileName}`);
      fs.copyFileSync(tempFilePath, permanentFilePath);
      fs.unlinkSync(tempFilePath); // Clean up temp file
      
      // Step 4: Prepare certificate data
      const certificateData = {
        certificateId,
        studentName: aiResults.extractedData.student_name || metadata.studentName || 'Unknown',
        rollNumber: aiResults.extractedData.roll_number || metadata.rollNumber || 'N/A',
        institution: institutionCode,
        institutionName: metadata.institutionName || institutionCode,
        course: aiResults.extractedData.course || metadata.course || 'Not Specified',
        courseName: aiResults.extractedData.course || metadata.courseName || 'Not Specified',
        grade: aiResults.extractedData.marks || metadata.grade || 'Pass',
        issueDate: aiResults.extractedData.issue_date ? 
                   new Date(aiResults.extractedData.issue_date) : 
                   (metadata.issueDate || new Date()),
        documentHash: aiResults.documentHash,
        filePath: permanentFilePath,
        
        // AI Analysis Results
        extractedData: {
          text: aiResults.extractedData.raw_text,
          confidence: aiResults.confidence,
          fields: aiResults.extractedData
        },
        
        // Signature verification results
        signatureVerification: aiResults.signatureVerification,
        
        // Risk assessment
        fraudScore: aiResults.fraudScore,
        
        // Verification status based on AI analysis
        verificationStatus: this.determineVerificationStatus(aiResults),
        
        // Additional metadata
        metadata: {
          originalFileName: fileName,
          fileSize: fileBuffer.length,
          uploadedAt: new Date(),
          hasFile: true,
          aiProcessingResults: aiResults.recommendations
        }
      };
      
      // Step 5: Store in MongoDB
      console.log('💾 Saving to database...');
      const certificate = new Certificate(certificateData);
      await certificate.save();
      
      // Step 6: Register on blockchain
      console.log('⛓️ Registering on blockchain...');
      try {
        const blockchainResult = await this.blockchainService.registerCertificate({
          studentName: certificateData.studentName,
          rollNumber: certificateData.rollNumber,
          institution: institutionCode,
          course: certificateData.course,
          grade: certificateData.grade,
          certId: certificateId,
          documentHash: certificateData.documentHash,
          documentBuffer: fileBuffer, // Pass the original file buffer
          issuedAt: Math.floor(certificateData.issueDate.getTime() / 1000)
        });
        
        // Update certificate with blockchain info
        certificate.blockchainHash = blockchainResult.transactionHash;
        certificate.transactionHash = blockchainResult.transactionHash;
        certificate.blockNumber = Number(blockchainResult.blockNumber); // Ensure it's a Number, not BigInt
        await certificate.save();
        
        console.log('✅ Certificate registered on blockchain');
        
      } catch (blockchainError) {
        console.error('⚠️ Blockchain registration failed:', blockchainError);
        // Continue without blockchain - certificate still saved in DB
        certificate.metadata.blockchainError = blockchainError.message;
        await certificate.save();
      }
      
      console.log('✅ Certificate processing completed');
      
      return {
        success: true,
        certificateId,
        certificate: certificate.toObject(),
        aiAnalysis: aiResults,
        message: 'Certificate processed successfully'
      };
      
    } catch (error) {
      console.error('❌ Certificate processing failed:', error);
      
      // Clean up temp file if it exists
      const tempFilePath = path.join(this.tempDir, `temp_${Date.now()}_${fileName}`);
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      
      throw error;
    }
  }

  /**
   * Process multiple certificates in bulk
   */
  async processBulkCertificates(files, institutionCode, metadata = {}) {
    const results = [];
    const errors = [];
    
    console.log(`📄 Processing ${files.length} certificates in bulk...`);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        console.log(`Processing ${i + 1}/${files.length}: ${file.originalname}`);
        
        const result = await this.processCertificate(
          file.buffer,
          file.originalname,
          institutionCode,
          metadata
        );
        
        results.push(result);
        
      } catch (error) {
        console.error(`Failed to process ${file.originalname}:`, error);
        errors.push({
          fileName: file.originalname,
          error: error.message
        });
      }
    }
    
    return {
      success: errors.length === 0,
      processed: results.length,
      total: files.length,
      results,
      errors
    };
  }

  /**
   * Verify a certificate against blockchain and database
   */
  async verifyCertificate(certificateId, documentHash = null) {
    try {
      // Check database first
      const dbCertificate = await Certificate.findByCertificateId(certificateId);
      
      if (!dbCertificate) {
        return {
          isValid: false,
          source: 'database',
          message: 'Certificate not found in database',
          certificateId
        };
      }
      
      // Verify document hash if provided
      if (documentHash && dbCertificate.documentHash !== documentHash) {
        return {
          isValid: false,
          source: 'database',
          message: 'Document hash mismatch - certificate may be tampered',
          certificateId,
          expectedHash: dbCertificate.documentHash,
          providedHash: documentHash
        };
      }
      
      // Check blockchain verification
      let blockchainValid = false;
      let blockchainMessage = '';
      
      try {
        const blockchainResult = await this.blockchainService.verifyCertificate(
          certificateId,
          documentHash || dbCertificate.documentHash
        );
        blockchainValid = blockchainResult.isValid;
        blockchainMessage = blockchainResult.message || 'Verified on blockchain';
      } catch (blockchainError) {
        blockchainMessage = `Blockchain verification failed: ${blockchainError.message}`;
      }
      
      // Determine overall validity
      const isValid = !dbCertificate.isBlacklisted && 
                     dbCertificate.verificationStatus === 'verified' &&
                     blockchainValid;
      
      return {
        isValid,
        certificate: dbCertificate.toObject(),
        blockchain: {
          verified: blockchainValid,
          message: blockchainMessage
        },
        database: {
          verified: true,
          status: dbCertificate.verificationStatus,
          blacklisted: dbCertificate.isBlacklisted
        },
        aiAnalysis: {
          fraudScore: dbCertificate.fraudScore || 0,
          confidence: dbCertificate.extractedData?.confidence || 0,
          signatureVerification: dbCertificate.signatureVerification
        }
      };
      
    } catch (error) {
      console.error('Certificate verification error:', error);
      return {
        isValid: false,
        error: error.message,
        certificateId
      };
    }
  }

  /**
   * Get student profile with all certificates
   */
  async getStudentProfile(rollNumber, institutionCode = null) {
    const query = { rollNumber };
    if (institutionCode) {
      query.institution = institutionCode;
    }
    
    const certificates = await Certificate.find(query).sort({ createdAt: -1 });
    
    if (certificates.length === 0) {
      return null;
    }
    
    // Group certificates by student
    const profile = {
      studentName: certificates[0].studentName,
      rollNumber: certificates[0].rollNumber,
      institution: certificates[0].institution,
      institutionName: certificates[0].institutionName,
      totalCertificates: certificates.length,
      certificates: certificates.map(cert => ({
        certificateId: cert.certificateId,
        course: cert.course,
        grade: cert.grade,
        issueDate: cert.issueDate,
        verificationStatus: cert.verificationStatus,
        fraudScore: cert.fraudScore || 0,
        isBlacklisted: cert.isBlacklisted,
        createdAt: cert.createdAt
      })),
      overallRiskScore: this.calculateOverallRiskScore(certificates),
      verificationSummary: this.getVerificationSummary(certificates)
    };
    
    return profile;
  }

  /**
   * Search certificates with various filters
   */
  async searchCertificates(filters = {}) {
    const query = {};
    
    // Build query based on filters
    if (filters.certificateId) {
      query.certificateId = new RegExp(filters.certificateId, 'i');
    }
    if (filters.studentName) {
      query.studentName = new RegExp(filters.studentName, 'i');
    }
    if (filters.rollNumber) {
      query.rollNumber = new RegExp(filters.rollNumber, 'i');
    }
    if (filters.institution) {
      query.institution = filters.institution;
    }
    if (filters.course) {
      query.course = new RegExp(filters.course, 'i');
    }
    if (filters.verificationStatus) {
      query.verificationStatus = filters.verificationStatus;
    }
    if (filters.isBlacklisted !== undefined) {
      query.isBlacklisted = filters.isBlacklisted;
    }
    if (filters.dateFrom || filters.dateTo) {
      query.issueDate = {};
      if (filters.dateFrom) query.issueDate.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.issueDate.$lte = new Date(filters.dateTo);
    }
    
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const skip = (page - 1) * limit;
    
    const certificates = await Certificate.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Certificate.countDocuments(query);
    
    return {
      certificates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find certificates by student details (for verification without cert ID)
   */
  async findCertificatesByStudent(searchDetails) {
    const { studentName, rollNumber, institutionCode, course } = searchDetails;
    
    // Build search query
    const query = {};
    
    if (studentName) {
      // Case-insensitive partial match for student name
      query['extractedData.student_name'] = { 
        $regex: studentName.trim(), 
        $options: 'i' 
      };
    }
    
    if (rollNumber) {
      // Exact match for roll number (but case-insensitive)
      query['extractedData.roll_number'] = { 
        $regex: `^${rollNumber.trim()}$`, 
        $options: 'i' 
      };
    }
    
    if (institutionCode) {
      query.institution = institutionCode;
    }
    
    if (course) {
      // Case-insensitive partial match for course
      query['extractedData.course'] = { 
        $regex: course.trim(), 
        $options: 'i' 
      };
    }
    
    console.log('🔍 Searching certificates with query:', JSON.stringify(query, null, 2));
    
    try {
      const certificates = await Certificate.find(query)
        .sort({ createdAt: -1 })
        .limit(50); // Limit to 50 results to avoid overwhelming the UI
      
      console.log(`📋 Found ${certificates.length} matching certificates`);
      
      // Return relevant information for verification
      const simplifiedCertificates = certificates.map(cert => ({
        certificateId: cert.certificateId,
        studentName: cert.extractedData?.student_name || 'N/A',
        rollNumber: cert.extractedData?.roll_number || 'N/A',
        course: cert.extractedData?.course || 'N/A',
        grade: cert.extractedData?.grade || 'N/A',
        institution: cert.institution,
        issueDate: cert.extractedData?.issue_date || cert.createdAt,
        verificationStatus: cert.verificationStatus,
        isBlacklisted: cert.isBlacklisted,
        fraudScore: cert.aiAnalysis?.fraudScore || 0,
        blockchain: {
          isRegistered: !!cert.blockchain?.transactionHash,
          transactionHash: cert.blockchain?.transactionHash
        }
      }));
      
      return {
        certificates: simplifiedCertificates,
        total: certificates.length
      };
      
    } catch (error) {
      console.error('Error finding certificates by student details:', error);
      throw new Error(`Failed to find certificates: ${error.message}`);
    }
  }

  /**
   * Get analytics and statistics
   */
  async getAnalytics(institutionCode = null) {
    const query = institutionCode ? { institution: institutionCode } : {};
    
    const [
      totalCertificates,
      verifiedCount,
      blacklistedCount,
      pendingCount,
      recentActivity
    ] = await Promise.all([
      Certificate.countDocuments(query),
      Certificate.countDocuments({ ...query, verificationStatus: 'verified' }),
      Certificate.countDocuments({ ...query, isBlacklisted: true }),
      Certificate.countDocuments({ ...query, verificationStatus: 'pending' }),
      Certificate.find(query)
        .sort({ createdAt: -1 })
        .limit(10)
        .select('certificateId studentName course verificationStatus createdAt')
    ]);
    
    return {
      totalCertificates,
      verifiedCount,
      blacklistedCount,
      pendingCount,
      verificationRate: totalCertificates > 0 ? (verifiedCount / totalCertificates) * 100 : 0,
      recentActivity
    };
  }

  // Helper methods
  generateCertificateId(institutionCode) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${institutionCode}_${timestamp}_${random}`.toUpperCase();
  }

  determineVerificationStatus(aiResults) {
    if (aiResults.fraudScore > 0.7) return 'invalid';
    if (aiResults.fraudScore > 0.4) return 'pending';
    if (aiResults.signatureVerification?.status === 'fraud') return 'invalid';
    if (aiResults.signatureVerification?.status === 'suspicious') return 'pending';
    return 'verified';
  }

  calculateOverallRiskScore(certificates) {
    if (certificates.length === 0) return 0;
    
    const totalRisk = certificates.reduce((sum, cert) => {
      return sum + (cert.fraudScore || 0);
    }, 0);
    
    return totalRisk / certificates.length;
  }

  getVerificationSummary(certificates) {
    const summary = {
      verified: 0,
      pending: 0,
      invalid: 0,
      blacklisted: 0
    };
    
    certificates.forEach(cert => {
      if (cert.isBlacklisted) {
        summary.blacklisted++;
      } else {
        summary[cert.verificationStatus]++;
      }
    });
    
    return summary;
  }
}

export default CertificateService;
