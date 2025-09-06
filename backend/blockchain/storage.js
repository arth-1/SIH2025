import fs from 'fs';
import path from 'path';

class DocumentStorageService {
  constructor() {
    this.localStorageDir = './uploads/documents';
    this.ensureLocalDirectoryExists();
  }

  ensureLocalDirectoryExists() {
    if (!fs.existsSync(this.localStorageDir)) {
      fs.mkdirSync(this.localStorageDir, { recursive: true });
    }
  }

  async storeDocuments(certificateData, watermarkResult, blockchainResult) {
    try {
      const timestamp = new Date().toISOString();
      const certId = certificateData.cert_id;
      
      const storageRecord = {
        cert_id: certId,
        student_name: certificateData.student_name,
        institution: certificateData.institution,
        course: certificateData.course,
        grade: certificateData.grade,
        issue_date: certificateData.issue_date,
        blockchain_hash: blockchainResult.hash,
        transaction_hash: blockchainResult.transactionHash,
        file_hash: watermarkResult.fileHash,
        watermarked_path: watermarkResult.watermarkedPath,
        metadata_path: watermarkResult.metadataPath,
        storage_timestamp: timestamp,
        verification_status: 'verified'
      };

      const storageFile = path.join(this.localStorageDir, `${certId}_storage.json`);
      fs.writeFileSync(storageFile, JSON.stringify(storageRecord, null, 2));

      console.log(`✅ Stored certificate ${certId} to local storage`);
      
      return {
        success: true,
        storageRecord,
        message: 'Documents stored successfully'
      };

    } catch (error) {
      console.error('Storage error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getCertificate(certId) {
    try {
      const storageFile = path.join(this.localStorageDir, `${certId}_storage.json`);
      
      if (!fs.existsSync(storageFile)) {
        return {
          success: false,
          error: 'Certificate not found in storage'
        };
      }

      const storageRecord = JSON.parse(fs.readFileSync(storageFile, 'utf8'));
      
      return {
        success: true,
        certificate: storageRecord
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async listCertificates(limit = 50) {
    try {
      const files = fs.readdirSync(this.localStorageDir)
        .filter(file => file.endsWith('_storage.json'))
        .slice(0, limit);

      const certificates = files.map(file => {
        const filePath = path.join(this.localStorageDir, file);
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      });

      return {
        success: true,
        certificates,
        total: certificates.length
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getDocumentFile(certId) {
    try {
      const certificate = await this.getCertificate(certId);
      
      if (!certificate.success) {
        return certificate;
      }

      const watermarkedPath = certificate.certificate.watermarked_path;
      
      if (!fs.existsSync(watermarkedPath)) {
        return {
          success: false,
          error: 'Watermarked file not found'
        };
      }

      return {
        success: true,
        filePath: watermarkedPath,
        certificate: certificate.certificate
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default DocumentStorageService;
