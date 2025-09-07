import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import Certificate from "../models/certificateModel.js";
import certificateService from "../services/certificateService.js";

// Helper function to convert BigInt values to strings for JSON serialization
function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  }));
}

const router = express.Router();
const upload = multer({ 
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept PDF, images
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'), false);
    }
  }
});

// Register a new certificate with blockchain integration
router.post("/register", upload.single("certificateFile"), async (req, res) => {
  try {
    const { studentName, courseName, institutionName, issueDate, institutionId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: "Certificate file is required" });
    }
    
    // Read file buffer
    const fileBuffer = fs.readFileSync(req.file.path);
    
    const certificateData = {
      studentName: studentName || 'Not Provided',
      courseName: courseName || 'Not Specified',
      institutionName: institutionName || 'Unknown Institution',
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      originalFileName: req.file.originalname
    };
    
    const result = await certificateService.registerCertificate(
      certificateData, 
      fileBuffer, 
      institutionId || 'default'
    );
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    if (result.success) {
      const serializedResult = serializeBigInt({
        message: "Certificate registered successfully",
        certificateId: result.certificateId,
        transactionHash: result.transactionHash,
        documentHash: result.documentHash
      });
      res.json(serializedResult);
    } else {
      res.status(400).json({ error: result.error });
    }
    
  } catch (err) {
    console.error('Certificate registration error:', err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Verify a certificate
router.post("/verify", upload.single("certificateFile"), async (req, res) => {
  try {
    const { certificateId } = req.body;
    
    if (!certificateId) {
      return res.status(400).json({ error: "Certificate ID is required" });
    }
    
    let fileBuffer = null;
    if (req.file) {
      fileBuffer = fs.readFileSync(req.file.path);
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
    }
    
    const result = await certificateService.verifyCertificate(certificateId, fileBuffer);
    
    if (result.success) {
      const serializedResult = serializeBigInt({
        message: "Certificate verification completed",
        isValid: true,
        certificate: result.certificate,
        blockchain: result.blockchain,
        documentIntegrity: result.documentIntegrity,
        transactionHash: result.transactionHash
      });
      res.json(serializedResult);
    } else {
      res.status(404).json({ 
        error: result.error,
        isValid: false,
        certificate: result.certificate || null
      });
    }
    
  } catch (err) {
    console.error('Certificate verification error:', err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// Get certificates for an institution
router.get("/institution/:institutionId", async (req, res) => {
  try {
    const { institutionId } = req.params;
    const result = await certificateService.getInstitutionCertificates(institutionId);
    
    if (result.success) {
      res.json(result.certificates);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch certificates" });
  }
});

// Search certificates
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: "Search query is required" });
    }
    
    const result = await certificateService.searchCertificates(q);
    
    if (result.success) {
      res.json(result.certificates);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});

// Get certificate statistics
router.get("/stats", async (req, res) => {
  try {
    const result = await certificateService.getCertificateStats();
    
    if (result.success) {
      res.json(result.stats);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Legacy routes for backward compatibility

// Single certificate upload (legacy)
router.post("/upload", async (req, res) => {
  try {
    const { image } = req.body;
    const cert = new Certificate({ 
      image,
      uploadedAt: new Date()
    });
    await cert.save();
    res.json({ message: "Certificate uploaded successfully." });
  } catch (err) {
    res.status(500).json({ error: "Upload failed." });
  }
});

// Bulk certificate upload (legacy)
router.post("/upload/bulk", async (req, res) => {
  try {
    const { certificates } = req.body; // Array of { image }
    if (!Array.isArray(certificates)) {
      return res.status(400).json({ error: "certificates must be an array." });
    }
    await Certificate.insertMany(certificates.map(img => ({ 
      image: img.image,
      uploadedAt: new Date()
    })));
    res.json({ message: "Bulk certificates uploaded successfully." });
  } catch (err) {
    res.status(500).json({ error: "Bulk upload failed." });
  }
});

// Excel upload (legacy)
router.post("/upload/excel", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }
    const filePath = path.resolve(req.file.path);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Each row should have an 'image' field
    const certificates = data.map(row => ({
      image: row.image,
      uploadedAt: new Date()
    }));

    await Certificate.insertMany(certificates);

    fs.unlinkSync(filePath); // Clean up

    res.json({ message: "Excel file processed and certificates uploaded." });
  } catch (err) {
    res.status(500).json({ error: "Excel upload failed." });
  }
});

export default router;