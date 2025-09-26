import Certificate from '../models/certificateModel.js';
import { hashDocument, createWatermark, verifyWatermark } from '../../blockchain/documentWatermarkService.js';
import blockchainService from '../../blockchain/blockchainService.js';
import signatureVerificationService from './signatureVerificationService.js';
import fs from 'fs';
import path from 'path';

export class CertificateService {
  /**
   * Register a new certificate with both MongoDB and blockchain
   */
  async registerCertificate(certificateData, fileBuffer, institutionId) {
    try {
      const documentHash = await hashDocument(fileBuffer);
      const watermarkData = await createWatermark(fileBuffer, certificateData);
      
      const now = Date.now();
      const issueDate = certificateData.issueDate ? new Date(certificateData.issueDate) : new Date();
      const issuedAtTimestamp = issueDate.getTime();
      const validIssuedAt = isNaN(issuedAtTimestamp) || issuedAtTimestamp < 0 ? now : issuedAtTimestamp;
      
      const blockchainData = {
        studentName: certificateData.studentName,
        rollNumber: certificateData.rollNumber || 'N/A',
        course: certificateData.courseName,
        grade: certificateData.grade || 'Pass',
        certId: `CERT_${now}`,
        issuedAt: validIssuedAt,
        institution: certificateData.institutionName,
        documentBuffer: fileBuffer
      };
      
      const blockchainResult = await blockchainService.registerCertificate(blockchainData);
      
      if (!blockchainResult.success) {
        throw new Error(`Blockchain registration failed: ${blockchainResult.error}`);
      }
      
      const imageSaveResult = await signatureVerificationService.saveCertificateImage(
        fileBuffer, 
        blockchainResult.certId,
        certificateData.originalFileName
      );
      
      const certificate = new Certificate({
        certificateId: blockchainResult.certId,
        studentName: certificateData.studentName,
        courseName: certificateData.courseName,
        institutionName: certificateData.institutionName,
        rollNumber: certificateData.rollNumber,
        issueDate: new Date(certificateData.issueDate),
        blockchainHash: blockchainResult.txHash,
        documentHash: documentHash,
        isVerified: true,
        verificationDate: new Date(),
        watermarkData: watermarkData,
        institutionId: institutionId,
        certificateImagePath: imageSaveResult.success ? imageSaveResult.filePath : null,
        certificateImage: imageSaveResult.success ? null : fileBuffer.toString('base64'),
        metadata: {
          originalFileName: certificateData.originalFileName || 'certificate.pdf',
          fileSize: fileBuffer.length,
          uploadedAt: new Date(),
          hasFile: true
        }
      });
      
      await certificate.save();
      
      return {
        success: true,
        certificateId: blockchainResult.certId,
        transactionHash: blockchainResult.txHash,
        mongodbId: certificate._id,
        documentHash: documentHash
      };
      
    } catch (error) {
      console.error('Certificate registration error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Verify a certificate using both MongoDB and blockchain
   */
  async verifyCertificate(certificateId, fileBuffer = null) {
    try {
      const certificate = await Certificate.findOne({ certificateId });
      
      if (!certificate) {
        return {
          success: false,
          error: 'Certificate not found in database'
        };
      }
      
      const blockchainVerification = await blockchainService.verifyCertificate(certificateId, fileBuffer);
      
      console.log('Blockchain verification result:', JSON.stringify(blockchainVerification, null, 2));
      
      if (!blockchainVerification.success || !blockchainVerification.isValid) {
        let errorMessage = 'Certificate verification failed on blockchain';
        if (blockchainVerification.success && !blockchainVerification.isValid) {
          errorMessage = 'Certificate found on blockchain but document hash does not match (document may be tampered)';
        } else if (blockchainVerification.error) {
          errorMessage = blockchainVerification.error;
        }
        
        return {
          success: false,
          error: errorMessage,
          certificate: certificate,
          blockchain: blockchainVerification
        };
      }
      
      let documentIntegrity = { verified: true, message: 'No document provided for integrity check' };
      let signatureVerification = null;
      
      if (fileBuffer) {
        const currentHash = await hashDocument(fileBuffer);
        
        if (currentHash !== certificate.documentHash) {
          documentIntegrity = {
            verified: false,
            message: 'Document has been tampered with',
            expectedHash: certificate.documentHash,
            actualHash: currentHash
          };
        } else {
          documentIntegrity = {
            verified: true,
            message: 'Document integrity verified'
          };
        }
        
        if (certificate.watermarkData) {
          const watermarkVerification = await verifyWatermark(fileBuffer, certificate.watermarkData);
          documentIntegrity.watermarkStatus = watermarkVerification;
        }
        
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempFilePath = path.join(tempDir, `verify_${Date.now()}_${certificateId}.pdf`);
        fs.writeFileSync(tempFilePath, fileBuffer);
        
        try {
          const sigVerificationResult = await signatureVerificationService.verifySignature(
            tempFilePath,
            certificate.studentName,
            certificate.rollNumber,
            certificateId
          );
          
          signatureVerification = sigVerificationResult.success 
            ? sigVerificationResult.signatureVerification 
            : { error: sigVerificationResult.error };
            
        } catch (sigError) {
          console.error('Signature verification error:', sigError);
          signatureVerification = { error: sigError.message };
        }
        
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          console.error('Error cleaning up temp file:', cleanupError);
        }
      }
      
      certificate.verificationCount = (certificate.verificationCount || 0) + 1;
      certificate.lastVerifiedAt = new Date();
      await certificate.save();
      
      return {
        success: true,
        certificate: {
          certificateId: certificate.certificateId,
          studentName: certificate.studentName,
          courseName: certificate.courseName,
          institutionName: certificate.institutionName,
          rollNumber: certificate.rollNumber,
          issueDate: certificate.issueDate,
          isVerified: certificate.isVerified,
          verificationDate: certificate.verificationDate,
          verificationCount: certificate.verificationCount,
          lastVerifiedAt: certificate.lastVerifiedAt
        },
        blockchain: blockchainVerification.certificate,
        documentIntegrity: documentIntegrity,
        signatureVerification: signatureVerification,
        transactionHash: certificate.blockchainHash
      };
      
    } catch (error) {
      console.error('Certificate verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get all certificates for an institution
   */
  async getInstitutionCertificates(institutionId) {
    try {
      const certificates = await Certificate.find({ institutionId })
        .sort({ issueDate: -1 })
        .select('-watermarkData'); // Exclude large watermark data
      
      return {
        success: true,
        certificates: certificates
      };
      
    } catch (error) {
      console.error('Error fetching institution certificates:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Search certificates by student name or course
   */
  async searchCertificates(query) {
    try {
      const searchRegex = new RegExp(query, 'i');
      
      const certificates = await Certificate.find({
        $or: [
          { studentName: searchRegex },
          { courseName: searchRegex },
          { institutionName: searchRegex },
          { certificateId: query }
        ]
      }).select('-watermarkData').limit(50);
      
      return {
        success: true,
        certificates: certificates
      };
      
    } catch (error) {
      console.error('Certificate search error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get certificate statistics
   */
  async getCertificateStats() {
    try {
      const totalCertificates = await Certificate.countDocuments();
      const verifiedCertificates = await Certificate.countDocuments({ isVerified: true });
      const recentCertificates = await Certificate.countDocuments({
        issueDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      });
      
      const institutionStats = await Certificate.aggregate([
        {
          $group: {
            _id: '$institutionName',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      return {
        success: true,
        stats: {
          total: totalCertificates,
          verified: verifiedCertificates,
          recent: recentCertificates,
          institutions: institutionStats
        }
      };
      
    } catch (error) {
      console.error('Error fetching certificate stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new CertificateService();
