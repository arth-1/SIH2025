import Certificate from '../models/certificateModel.js';
import { hashDocument, createWatermark, verifyWatermark } from '../../blockchain/documentWatermarkService.js';
import blockchainService from '../../blockchain/blockchainService.js';

export class CertificateService {
  /**
   * Register a new certificate with both MongoDB and blockchain
   */
  async registerCertificate(certificateData, fileBuffer, institutionId) {
    try {
      // Generate document hash from the required file buffer
      const documentHash = await hashDocument(fileBuffer);
      
      // Create watermark for the document
      const watermarkData = await createWatermark(fileBuffer, certificateData);
      
      // Prepare certificate data for blockchain
      const now = Date.now();
      const issueDate = certificateData.issueDate ? new Date(certificateData.issueDate) : new Date();
      
      // Ensure we have a valid positive timestamp
      const issuedAtTimestamp = issueDate.getTime();
      const validIssuedAt = isNaN(issuedAtTimestamp) || issuedAtTimestamp < 0 ? now : issuedAtTimestamp;
      
      const blockchainData = {
        studentName: certificateData.studentName,
        rollNumber: certificateData.rollNumber || 'N/A',
        course: certificateData.courseName,
        grade: certificateData.grade || 'Pass',
        certId: `CERT_${now}`,
        issuedAt: validIssuedAt, // Always positive timestamp
        institution: certificateData.institutionName,
        documentBuffer: fileBuffer // File is required
      };
      
      // Register on blockchain first
      const blockchainResult = await blockchainService.registerCertificate(blockchainData);
      
      if (!blockchainResult.success) {
        throw new Error(`Blockchain registration failed: ${blockchainResult.error}`);
      }
      
      // Create certificate record in MongoDB
      const certificate = new Certificate({
        certificateId: blockchainResult.certId,
        studentName: certificateData.studentName,
        courseName: certificateData.courseName,
        institutionName: certificateData.institutionName,
        issueDate: new Date(certificateData.issueDate),
        blockchainHash: blockchainResult.txHash,
        documentHash: documentHash,
        isVerified: true,
        verificationDate: new Date(),
        watermarkData: watermarkData,
        institutionId: institutionId,
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
      // Get certificate from MongoDB
      const certificate = await Certificate.findOne({ certificateId });
      
      if (!certificate) {
        return {
          success: false,
          error: 'Certificate not found in database'
        };
      }
      
      // Verify on blockchain
      const blockchainVerification = await blockchainService.verifyCertificate(certificateId, fileBuffer);
      
      if (!blockchainVerification.success) {
        return {
          success: false,
          error: 'Certificate not found on blockchain',
          certificate: certificate
        };
      }
      
      // If file is provided, verify document integrity
      let documentIntegrity = { verified: true, message: 'No document provided for integrity check' };
      
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
        
        // Verify watermark if available
        if (certificate.watermarkData) {
          const watermarkVerification = await verifyWatermark(fileBuffer, certificate.watermarkData);
          documentIntegrity.watermarkStatus = watermarkVerification;
        }
      }
      
      // Update verification count and last verified date
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
          issueDate: certificate.issueDate,
          isVerified: certificate.isVerified,
          verificationDate: certificate.verificationDate,
          verificationCount: certificate.verificationCount,
          lastVerifiedAt: certificate.lastVerifiedAt
        },
        blockchain: blockchainVerification.certificate,
        documentIntegrity: documentIntegrity,
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
