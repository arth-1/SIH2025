import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

class DocumentWatermarkService {
  constructor() {
    this.uploadsDir = './uploads';
    this.watermarkedDir = './uploads/watermarked';
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(this.watermarkedDir)) {
      fs.mkdirSync(this.watermarkedDir, { recursive: true });
    }
  }

  generateFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  async watermarkDocument(filePath, certificateData, blockchainHash) {
    try {
      const originalHash = this.generateFileHash(filePath);
      const fileExtension = path.extname(filePath);
      const baseName = path.basename(filePath, fileExtension);
      
      const watermarkedFileName = `${baseName}_watermarked${fileExtension}`;
      const watermarkedPath = path.join(this.watermarkedDir, watermarkedFileName);
      
      fs.copyFileSync(filePath, watermarkedPath);
      
      const metadata = {
        originalFile: baseName + fileExtension,
        watermarkedFile: watermarkedFileName,
        certificateData,
        blockchainHash,
        originalFileHash: originalHash,
        watermarkTimestamp: new Date().toISOString(),
        verificationUrl: `verify/${certificateData.cert_id}`
      };
      
      const metadataPath = path.join(this.watermarkedDir, `${baseName}_metadata.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      return {
        success: true,
        originalPath: filePath,
        watermarkedPath,
        metadataPath,
        metadata,
        fileHash: originalHash
      };
      
    } catch (error) {
      console.error('Watermarking error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyWatermark(watermarkedFilePath) {
    try {
      const baseName = path.basename(watermarkedFilePath, path.extname(watermarkedFilePath)).replace('_watermarked', '');
      const metadataPath = path.join(path.dirname(watermarkedFilePath), `${baseName}_metadata.json`);
      
      if (!fs.existsSync(metadataPath)) {
        return {
          success: false,
          error: 'Metadata file not found - document may not be watermarked'
        };
      }
      
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      const currentHash = this.generateFileHash(watermarkedFilePath);
      
      return {
        success: true,
        metadata,
        currentFileHash: currentHash,
        isIntact: true,
        verificationData: metadata
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateDataHash(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }
}

// Export simple functions for easy use
export const hashDocument = (fileBuffer) => {
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

export const createWatermark = async (fileBuffer, certificateData) => {
  return {
    timestamp: new Date().toISOString(),
    certificateId: certificateData.certificateId || certificateData.certId,
    studentName: certificateData.studentName,
    courseName: certificateData.courseName,
    documentHash: hashDocument(fileBuffer)
  };
};

export const verifyWatermark = async (fileBuffer, watermarkData) => {
  const currentHash = hashDocument(fileBuffer);
  return {
    verified: currentHash === watermarkData.documentHash,
    currentHash,
    expectedHash: watermarkData.documentHash
  };
};

export default DocumentWatermarkService;
