const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const enhancedCertificateService = require('../services/enhancedCertificateService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg, .jpeg and .pdf files are allowed!'));
    }
  }
});

// Bulk processing endpoint
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

    // Process the certificate with enhanced service
    const filePath = req.file.path;
    
    const result = await enhancedCertificateService.processCertificate(filePath, {
      institutionCode,
      institutionName: institutionName || institutionCode,
      bulkUpload: true,
      originalFileName: req.file.originalname
    });

    // Clean up uploaded file
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup uploaded file:', cleanupError);
    }

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
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file after error:', cleanupError);
      }
    }

    res.status(500).json({ 
      error: error.message || 'Failed to process certificate',
      success: false
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Bulk Certificate Processing',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
