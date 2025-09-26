import express from 'express';
import multer from 'multer';
import CertificateService from '../services/enhancedCertificateService.js';
import { CertificateService as RegularCertificateService } from '../services/certificateService.js';
import AIService from '../services/aiService.js';
import emailService from '../services/emailService.js';
import path from 'path';

const router = express.Router();
const certificateService = new CertificateService();
const regularCertificateService = new RegularCertificateService();
const aiService = new AIService();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // Default 50MB limit
    files: 50 // Max 50 files
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = (process.env.ALLOWED_EXTENSIONS || 'jpg,jpeg,png,pdf,heic').split(',');
    const fileExt = path.extname(file.originalname).toLowerCase().slice(1);
    
    if (allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`Only ${allowedExtensions.join(', ')} files are allowed`), false);
    }
  }
});

/**
 * Upload and process a single certificate with AI analysis
 */
router.post('/upload', upload.single('certificate'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No certificate file provided'
      });
    }

    const { institutionCode, studentName, rollNumber, course, grade } = req.body;

    if (!institutionCode) {
      return res.status(400).json({
        success: false,
        message: 'Institution code is required'
      });
    }

    const metadata = {
      studentName,
      rollNumber,
      course,
      grade,
      institutionName: req.body.institutionName
    };

    const result = await certificateService.processCertificate(
      req.file.buffer,
      req.file.originalname,
      institutionCode,
      metadata
    );

    res.json(result);

  } catch (error) {
    console.error('Certificate upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Certificate processing failed',
      error: error.message
    });
  }
});

/**
 * Bulk upload and process multiple certificates
 */
router.post('/upload/bulk', upload.array('certificates', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No certificate files provided'
      });
    }

    const { institutionCode } = req.body;

    if (!institutionCode) {
      return res.status(400).json({
        success: false,
        message: 'Institution code is required'
      });
    }

    const metadata = {
      institutionName: req.body.institutionName
    };

    const result = await certificateService.processBulkCertificates(
      req.files,
      institutionCode,
      metadata
    );

    res.json(result);

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk certificate processing failed',
      error: error.message
    });
  }
});

/**
 * Verify a certificate by ID and optional document hash
 */
router.get('/verify/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { documentHash } = req.query;

    const result = await certificateService.verifyCertificate(certificateId, documentHash);

    res.json(result);

  } catch (error) {
    console.error('Certificate verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Certificate verification failed',
      error: error.message
    });
  }
});

/**
 * Comprehensive certificate verification with file upload and signature verification
 */
router.post('/verify/:certificateId', upload.single('certificateFile'), async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { email } = req.body; // Extract email from request body
    
    if (!certificateId) {
      return res.status(400).json({
        success: false,
        message: 'Certificate ID is required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Certificate file is required for comprehensive verification'
      });
    }

    // Perform comprehensive verification including signature verification
    const result = await regularCertificateService.verifyCertificate(certificateId, req.file.buffer);
    
    console.log('Verification result:', JSON.stringify(result, null, 2));

    // Transform the result to match the expected format for the frontend
    const transformedResult = {
      success: result.success,
      documentCheck: result.success && !!result.certificate,
      blockchainVerification: result.success, // If overall success is true, blockchain verification passed
      integrityCheck: result.success && (!result.documentIntegrity || result.documentIntegrity.verified),
      signatureVerification: result.signatureVerification,
      certificateData: result.certificate,
      blockchainData: result.blockchain,
      transactionHash: result.transactionHash,
      verificationDate: new Date().toISOString(),
      error: result.error
    };

    // Send email notification if email is provided or if certificate has student email
    let emailToSend = email && email.trim() ? email.trim() : null;
    
    // If no email provided but certificate has student email, use that
    if (!emailToSend && result.certificate && result.certificate.studentEmail) {
      emailToSend = result.certificate.studentEmail;
    }

    if (emailToSend) {
      try {
        const emailResult = await emailService.sendVerificationResult(emailToSend, transformedResult, certificateId);
        console.log('Email notification sent to:', emailToSend, emailResult);
        transformedResult.emailSent = emailResult.success;
        transformedResult.emailStatus = emailResult.success ? 'sent' : 'failed';
        transformedResult.emailRecipient = emailToSend;
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        transformedResult.emailSent = false;
        transformedResult.emailStatus = 'failed';
        transformedResult.emailError = emailError.message;
        transformedResult.emailRecipient = emailToSend;
      }
    }

    res.json(transformedResult);

  } catch (error) {
    console.error('Comprehensive certificate verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Comprehensive certificate verification failed',
      error: error.message
    });
  }
});

/**
 * Get student profile with all certificates
 */
router.get('/student/:rollNumber', async (req, res) => {
  try {
    const { rollNumber } = req.params;
    const { institutionCode } = req.query;

    const profile = await certificateService.getStudentProfile(rollNumber, institutionCode);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student profile',
      error: error.message
    });
  }
});

/**
 * Find certificates by student details (for verification without cert ID)
 */
router.post('/find-by-student', async (req, res) => {
  try {
    const { studentName, rollNumber, institutionCode, course } = req.body;
    
    if (!studentName && !rollNumber) {
      return res.status(400).json({
        success: false,
        message: 'At least student name or roll number is required'
      });
    }

    const result = await certificateService.findCertificatesByStudent({
      studentName,
      rollNumber,
      institutionCode,
      course
    });

    res.json({
      success: true,
      certificates: result.certificates,
      total: result.total
    });

  } catch (error) {
    console.error('Find certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find certificates',
      error: error.message
    });
  }
});

/**
 * Search certificates with filters
 */
router.get('/search', async (req, res) => {
  try {
    const filters = req.query;
    const result = await certificateService.searchCertificates(filters);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Certificate search error:', error);
    res.status(500).json({
      success: false,
      message: 'Certificate search failed',
      error: error.message
    });
  }
});

/**
 * Get analytics and statistics
 */
router.get('/analytics', async (req, res) => {
  try {
    const { institutionCode } = req.query;
    const analytics = await certificateService.getAnalytics(institutionCode);

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics',
      error: error.message
    });
  }
});

/**
 * Extract data from certificate using AI (without storing)
 */
router.post('/extract', upload.single('certificate'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No certificate file provided'
      });
    }

    // Save file temporarily for AI processing
    const tempFilePath = path.join(aiService.tempDir, `extract_${Date.now()}_${req.file.originalname}`);
    require('fs').writeFileSync(tempFilePath, req.file.buffer);

    const extractedData = await aiService.extractCertificateData(tempFilePath);

    // Clean up temp file
    require('fs').unlinkSync(tempFilePath);

    res.json({
      success: true,
      extractedData
    });

  } catch (error) {
    console.error('Data extraction error:', error);
    res.status(500).json({
      success: false,
      message: 'Data extraction failed',
      error: error.message
    });
  }
});

/**
 * Verify signature authenticity
 */
router.post('/verify-signature', upload.fields([
  { name: 'certificate', maxCount: 1 },
  { name: 'reference', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files?.certificate || !req.files?.reference) {
      return res.status(400).json({
        success: false,
        message: 'Both certificate and reference signature files are required'
      });
    }

    const fs = require('fs');
    
    // Save files temporarily
    const certPath = path.join(aiService.tempDir, `cert_${Date.now()}_${req.files.certificate[0].originalname}`);
    const refPath = path.join(aiService.tempDir, `ref_${Date.now()}_${req.files.reference[0].originalname}`);
    
    fs.writeFileSync(certPath, req.files.certificate[0].buffer);
    fs.writeFileSync(refPath, req.files.reference[0].buffer);

    const signatureResults = await aiService.verifySignature(certPath, refPath);

    // Clean up temp files
    fs.unlinkSync(certPath);
    fs.unlinkSync(refPath);

    res.json({
      success: true,
      signatureResults
    });

  } catch (error) {
    console.error('Signature verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Signature verification failed',
      error: error.message
    });
  }
});

/**
 * Get certificate by ID
 */
router.get('/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    
    const Certificate = (await import('../models/certificateModel.js')).default;
    const certificate = await Certificate.findByCertificateId(certificateId);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    res.json({
      success: true,
      certificate: certificate.toObject()
    });

  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve certificate',
      error: error.message
    });
  }
});

/**
 * Blacklist a certificate
 */
router.post('/:certificateId/blacklist', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Blacklist reason is required'
      });
    }

    const Certificate = (await import('../models/certificateModel.js')).default;
    const certificate = await Certificate.findByCertificateId(certificateId);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    await certificate.blacklist(reason);

    res.json({
      success: true,
      message: 'Certificate blacklisted successfully'
    });

  } catch (error) {
    console.error('Blacklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to blacklist certificate',
      error: error.message
    });
  }
});

/**
 * Get system configuration and health status
 */
router.get('/system/config', (req, res) => {
  try {
    const config = {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
      allowedExtensions: (process.env.ALLOWED_EXTENSIONS || 'jpg,jpeg,png,pdf').split(','),
      fraudThreshold: parseFloat(process.env.FRAUD_THRESHOLD) || 0.5,
      signatureThreshold: parseFloat(process.env.SIGNATURE_THRESHOLD) || 0.5,
      tesseractAvailable: !!process.env.TESSERACT_PATH,
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      nodeEnv: process.env.NODE_ENV || 'development'
    };

    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve configuration',
      error: error.message
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/system/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: false,
        blockchain: false,
        ai: false
      }
    };

    // Check database connection
    try {
      const mongoose = await import('mongoose');
      health.services.database = mongoose.default.connection.readyState === 1;
    } catch (e) {
      health.services.database = false;
    }

    // Check AI service
    health.services.ai = !!(process.env.GEMINI_API_KEY && process.env.TESSERACT_PATH);

    // Check blockchain service
    try {
      const blockchainService = (await import('../../blockchain/blockchainService.js')).default;
      // Test actual blockchain connectivity
      health.services.blockchain = !!(blockchainService.web3 && process.env.BLOCKCHAIN_URL);
    } catch (e) {
      health.services.blockchain = false;
    }

    const allHealthy = Object.values(health.services).every(status => status);
    if (!allHealthy) {
      health.status = 'degraded';
    }

    res.json({
      success: true,
      health
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      health: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      }
    });
  }
});

/**
 * Bulk processing endpoint for universities
 */
router.post('/bulk-process', upload.single('certificateFile'), async (req, res) => {
  try {
    const { institutionCode, institutionName, bulkUpload } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!institutionCode) {
      return res.status(400).json({ error: 'Institution code is required' });
    }

    console.log(`Processing bulk upload for institution: ${institutionCode}`);
    console.log(`File: ${req.file.originalname}`);

    // Process the certificate
    const result = await certificateService.processCertificate(
      req.file.buffer,
      req.file.originalname,
      institutionCode,
      {
        institutionName: institutionName || institutionCode,
        bulkUpload: true
      }
    );

    res.json({
      success: true,
      certificateId: result.certificateId,
      extractedData: result.extractedData,
      verification: result.verification,
      blockchain: result.blockchain,
      aiAnalysis: result.aiAnalysis,
      message: 'Certificate processed successfully'
    });

  } catch (error) {
    console.error('Bulk processing error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process certificate',
      success: false
    });
  }
});

/**
 * Find certificates by student details
 */
router.post('/find-by-student', async (req, res) => {
  try {
    const { studentName, rollNumber, courseName, institutionName } = req.body;
    
    console.log('Searching for certificates with criteria:', {
      studentName,
      rollNumber, 
      courseName,
      institutionName
    });

    const certificates = await certificateService.findCertificatesByStudent({
      studentName,
      rollNumber,
      courseName,
      institutionName
    });

    res.json({
      success: true,
      certificates,
      count: certificates.length
    });

  } catch (error) {
    console.error('Student search error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to search certificates',
      success: false
    });
  }
});

/**
 * Send OTP to email (standalone endpoint)
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const result = await emailService.sendOTP(email, otp);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'OTP sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP',
        error: result.error
      });
    }
  } catch (error) {
    console.error('OTP sending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

/**
 * Test email service connection
 */
router.get('/test-email', async (req, res) => {
  try {
    const result = await emailService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
