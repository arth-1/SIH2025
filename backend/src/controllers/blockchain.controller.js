import blockchainService from '../../blockchain/blockchainService.js';
import DocumentWatermarkService from '../../blockchain/documentWatermarkService.js';
import DocumentStorageService from '../../blockchain/documentStorageService.js';
import multer from 'multer';
import crypto from 'crypto';

// Initialize services
const watermarkService = new DocumentWatermarkService();
const storageService = new DocumentStorageService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF files and images
    if (file.mimetype === 'application/pdf' || 
        file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'), false);
    }
  }
});

// Register a single certificate with watermarking and storage
export const registerCertificate = async (req, res) => {
  try {
    const {
      studentName,
      rollNumber,
      course,
      grade,
      certId,
      issuedAt,
      institution
    } = req.body;

    // Validate required fields
    if (!studentName || !rollNumber || !course || !grade || !certId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Certificate document is required'
      });
    }

    // Prepare certificate data
    const certificateData = {
      studentName,
      rollNumber,
      course,
      grade,
      certId,
      institution: institution || 'UNKNOWN',
      originalFileSize: req.file.size,
      issuedAt: issuedAt ? new Date(issuedAt).getTime() : Date.now()
    };

    // Step 1: Register on blockchain first
    const blockchainData = {
      ...certificateData,
      documentBuffer: req.file.buffer
    };

    const blockchainResult = await blockchainService.registerCertificate(blockchainData);

    // Step 2: Generate watermarked document with blockchain transaction hash
    const watermarkResult = await watermarkService.processAndWatermarkFile(
      req.file.buffer,
      req.file.mimetype,
      certificateData,
      blockchainResult.transactionHash
    );

    // Step 3: Store both original and watermarked files in database
    const storageResult = await storageService.storeDocuments(
      certificateData,
      watermarkResult,
      blockchainResult
    );

    res.status(201).json({
      success: true,
      message: 'Certificate registered, watermarked, and stored successfully',
      data: {
        blockchain: blockchainResult,
        watermark: {
          fileName: watermarkResult.fileName,
          fileSize: watermarkResult.fileSize,
          hashes: watermarkResult.hashes,
          verificationData: watermarkResult.verificationData
        },
        storage: storageResult,
        downloadUrl: storageResult.fileUrl || `/api/blockchain/certificates/${certId}/download`
      }
    });

  } catch (error) {
    console.error('Error in registerCertificate:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to register certificate'
    });
  }
};

// Register multiple certificates in batch
export const registerCertificatesBatch = async (req, res) => {
  try {
    const { certificates } = req.body;

    if (!certificates || !Array.isArray(certificates) || certificates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Certificates array is required'
      });
    }

    // Validate each certificate
    const validatedCertificates = [];
    for (const cert of certificates) {
      if (!cert.studentName || !cert.rollNumber || !cert.course || 
          !cert.grade || !cert.certId || !cert.documentBase64) {
        return res.status(400).json({
          success: false,
          error: `Missing required fields for certificate ${cert.certId || 'unknown'}`
        });
      }

      // Convert base64 to buffer
      const documentBuffer = Buffer.from(cert.documentBase64, 'base64');
      
      validatedCertificates.push({
        studentName: cert.studentName,
        rollNumber: cert.rollNumber,
        course: cert.course,
        grade: cert.grade,
        certId: cert.certId,
        documentBuffer: documentBuffer,
        issuedAt: cert.issuedAt ? new Date(cert.issuedAt).getTime() : Date.now()
      });
    }

    // Register batch on blockchain
    const result = await blockchainService.registerCertificatesBatch(validatedCertificates);

    res.status(201).json({
      success: true,
      message: `${result.processedCount} certificates registered successfully`,
      data: result
    });

  } catch (error) {
    console.error('Error in registerCertificatesBatch:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to register certificates batch'
    });
  }
};

// Enhanced verification with watermark checking
export const verifyCertificate = async (req, res) => {
  try {
    const { certId } = req.params;

    if (!certId) {
      return res.status(400).json({
        success: false,
        error: 'Certificate ID is required'
      });
    }

    // Check if file is uploaded for verification
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Certificate document is required for verification'
      });
    }

    // Step 1: Verify on blockchain
    const blockchainResult = await blockchainService.verifyCertificate(certId, req.file.buffer);

    // Step 2: Check if we have stored data for this certificate
    const storedDocument = await storageService.getDocument(certId);

    // Step 3: Extract any embedded verification data
    const extractedData = await watermarkService.extractVerificationData(
      req.file.buffer, 
      req.file.mimetype
    );

    // Step 4: Get full certificate details if verification is successful
    let certificateDetails = null;
    if (blockchainResult.isValid) {
      const detailsResult = await blockchainService.getCertificate(certId);
      if (detailsResult.success) {
        certificateDetails = detailsResult.certificate;
      }
    }

    // Comprehensive verification result
    const verificationResult = {
      certId: certId,
      blockchainValid: blockchainResult.isValid,
      hashMatches: blockchainResult.isValid,
      hasStoredRecord: !!storedDocument,
      hasWatermark: !!extractedData,
      overallValid: blockchainResult.isValid,
      verificationLevel: blockchainResult.isValid ? 
        (storedDocument ? 'FULL_VERIFICATION' : 'BLOCKCHAIN_ONLY') : 
        'INVALID',
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      verification: verificationResult,
      certificate: certificateDetails,
      storedData: storedDocument?.document || null,
      extractedData: extractedData,
      message: verificationResult.overallValid ? 
        'Certificate is authentic and verified' : 
        'Certificate is invalid or tampered'
    });

  } catch (error) {
    console.error('Error in verifyCertificate:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify certificate'
    });
  }
};

// Get certificate details
export const getCertificate = async (req, res) => {
  try {
    const { certId } = req.params;

    if (!certId) {
      return res.status(400).json({
        success: false,
        error: 'Certificate ID is required'
      });
    }

    const result = await blockchainService.getCertificate(certId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found'
      });
    }

    res.status(200).json({
      success: true,
      certificate: result.certificate
    });

  } catch (error) {
    console.error('Error in getCertificate:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get certificate'
    });
  }
};

// Check if certificate exists
export const checkCertificateExists = async (req, res) => {
  try {
    const { certId } = req.params;

    if (!certId) {
      return res.status(400).json({
        success: false,
        error: 'Certificate ID is required'
      });
    }

    const result = await blockchainService.certificateExists(certId);

    res.status(200).json({
      success: true,
      exists: result.exists,
      certId: certId
    });

  } catch (error) {
    console.error('Error in checkCertificateExists:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check certificate existence'
    });
  }
};

// Register institution (admin only)
export const registerInstitution = async (req, res) => {
  try {
    const { institutionCode, name, authorizedSigner } = req.body;

    if (!institutionCode || !name || !authorizedSigner) {
      return res.status(400).json({
        success: false,
        error: 'Institution code, name, and authorized signer are required'
      });
    }

    const result = await blockchainService.registerInstitution(
      institutionCode,
      name,
      authorizedSigner
    );

    res.status(201).json({
      success: true,
      message: 'Institution registered successfully',
      data: result
    });

  } catch (error) {
    console.error('Error in registerInstitution:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to register institution'
    });
  }
};

// Get institution details
export const getInstitution = async (req, res) => {
  try {
    const { institutionCode } = req.params;

    if (!institutionCode) {
      return res.status(400).json({
        success: false,
        error: 'Institution code is required'
      });
    }

    const result = await blockchainService.getInstitution(institutionCode);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'Institution not found'
      });
    }

    res.status(200).json({
      success: true,
      institution: result.institution
    });

  } catch (error) {
    console.error('Error in getInstitution:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get institution'
    });
  }
};

// Blacklist certificate (admin only)
export const blacklistCertificate = async (req, res) => {
  try {
    const { certId } = req.params;

    if (!certId) {
      return res.status(400).json({
        success: false,
        error: 'Certificate ID is required'
      });
    }

    const result = await blockchainService.blacklistCertificate(certId);

    res.status(200).json({
      success: true,
      message: 'Certificate blacklisted successfully',
      data: result
    });

  } catch (error) {
    console.error('Error in blacklistCertificate:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to blacklist certificate'
    });
  }
};

// Check if certificate is blacklisted
export const checkBlacklisted = async (req, res) => {
  try {
    const { certId } = req.params;

    if (!certId) {
      return res.status(400).json({
        success: false,
        error: 'Certificate ID is required'
      });
    }

    const result = await blockchainService.isBlacklisted(certId);

    res.status(200).json({
      success: true,
      isBlacklisted: result.isBlacklisted,
      certId: certId
    });

  } catch (error) {
    console.error('Error in checkBlacklisted:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check blacklist status'
    });
  }
};

// Get blockchain network info
export const getNetworkInfo = async (req, res) => {
  try {
    const result = await blockchainService.getNetworkInfo();

    res.status(200).json({
      success: true,
      network: result
    });

  } catch (error) {
    console.error('Error in getNetworkInfo:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get network info'
    });
  }
};

// Download watermarked certificate
export const downloadWatermarkedCertificate = async (req, res) => {
  try {
    const { certId } = req.params;

    if (!certId) {
      return res.status(400).json({
        success: false,
        error: 'Certificate ID is required'
      });
    }

    const fileResult = await storageService.getWatermarkedFile(certId);

    if (!fileResult || !fileResult.success) {
      return res.status(404).json({
        success: false,
        error: 'Watermarked certificate not found'
      });
    }

    // Set appropriate headers for file download
    const fileExtension = fileResult.fileName.split('.').pop();
    const mimeType = fileExtension === 'pdf' ? 'application/pdf' : 'image/png';
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileResult.fileName}"`);
    res.setHeader('Content-Length', fileResult.file.length || fileResult.file.byteLength);

    // Send the file
    if (fileResult.file instanceof ArrayBuffer) {
      res.send(Buffer.from(fileResult.file));
    } else {
      res.send(fileResult.file);
    }

  } catch (error) {
    console.error('Error in downloadWatermarkedCertificate:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to download watermarked certificate'
    });
  }
};

// Get certificate with storage info
export const getCertificateWithStorage = async (req, res) => {
  try {
    const { certId } = req.params;

    if (!certId) {
      return res.status(400).json({
        success: false,
        error: 'Certificate ID is required'
      });
    }

    // Get blockchain data
    const blockchainResult = await blockchainService.getCertificate(certId);
    
    // Get storage data
    const storageResult = await storageService.getDocument(certId);

    if (!blockchainResult.success && !storageResult) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found'
      });
    }

    res.status(200).json({
      success: true,
      blockchain: blockchainResult.success ? blockchainResult.certificate : null,
      storage: storageResult ? storageResult.document : null,
      hasWatermarkedFile: !!storageResult,
      downloadUrl: storageResult ? `/api/blockchain/certificates/${certId}/download` : null
    });

  } catch (error) {
    console.error('Error in getCertificateWithStorage:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get certificate'
    });
  }
};

// List all verified certificates with storage info
export const listVerifiedCertificates = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await storageService.listVerifiedCertificates(limit, offset);

    res.status(200).json({
      success: true,
      certificates: result.certificates,
      total: result.total,
      limit: limit,
      offset: offset,
      hasMore: offset + limit < result.total,
      storage: result.storage
    });

  } catch (error) {
    console.error('Error in listVerifiedCertificates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list certificates'
    });
  }
};

// Middleware for file upload
export const uploadMiddleware = upload.single('certificate');

// Middleware for batch upload (no file, just JSON data)
export const uploadBatchMiddleware = (req, res, next) => {
  next();
};
