import Certificate from '../models/certificateModel.js';
import blockchainService from '../../blockchain/blockchainService.js';
import fs from 'fs';
import crypto from 'crypto';

/**
 * Certificate Sync Service
 * Re-registers existing MongoDB certificates on fresh blockchain
 */
export class CertificateSyncService {
    
    /**
     * Check if certificates in MongoDB need blockchain registration
     */
    async checkSyncNeeded() {
        try {
            // Get all certificates from MongoDB
            const allCertificates = await Certificate.find({});
            console.log(`📊 Found ${allCertificates.length} certificates in MongoDB`);
            
            if (allCertificates.length === 0) {
                return { syncNeeded: false, certificates: [] };
            }
            
            // Check which ones are missing from blockchain
            const missingFromBlockchain = [];
            
            for (const cert of allCertificates) {
                try {
                    const existsOnBlockchain = await blockchainService.certificateExists(cert.certificateId);
                    if (!existsOnBlockchain) {
                        missingFromBlockchain.push(cert);
                        console.log(`⚠️  Certificate ${cert.certificateId} missing from blockchain`);
                    }
                } catch (error) {
                    // If we can't check, assume it's missing
                    missingFromBlockchain.push(cert);
                }
            }
            
            return {
                syncNeeded: missingFromBlockchain.length > 0,
                certificates: missingFromBlockchain,
                total: allCertificates.length,
                missing: missingFromBlockchain.length
            };
            
        } catch (error) {
            console.error('❌ Error checking sync status:', error.message);
            return { syncNeeded: false, certificates: [] };
        }
    }
    
    /**
     * Re-register a single certificate on blockchain
     */
    async reRegisterCertificate(certificate) {
        try {
            console.log(`🔄 Re-registering certificate: ${certificate.certificateId}`);
            
            // Create blockchain data from MongoDB record
            const blockchainData = {
                studentName: certificate.studentName || 'Not Provided',
                rollNumber: certificate.rollNumber || 'N/A',
                course: certificate.courseName || certificate.institution || 'Unknown Course',
                grade: certificate.grade || 'Pass',
                certId: certificate.certificateId,
                issuedAt: certificate.issueDate ? new Date(certificate.issueDate).getTime() : Date.now(),
                institution: certificate.institutionName || certificate.institution || 'Unknown Institution',
                documentBuffer: null // We don't have the original file
            };
            
            // If we don't have the original file, create a placeholder hash
            let documentHash = certificate.documentHash;
            if (!documentHash) {
                // Generate a consistent hash from certificate data
                const dataString = JSON.stringify({
                    id: certificate.certificateId,
                    student: blockchainData.studentName,
                    course: blockchainData.course,
                    institution: blockchainData.institution
                });
                documentHash = crypto.createHash('sha256').update(dataString).digest('hex');
            }
            
            // Override the document buffer with our existing hash
            blockchainData.documentHash = documentHash;
            
            // Register on blockchain
            const result = await blockchainService.registerCertificate(blockchainData);
            
            if (result.success) {
                // Update MongoDB record with new blockchain hash
                await Certificate.findByIdAndUpdate(certificate._id, {
                    blockchainHash: result.txHash,
                    isVerified: true,
                    verificationDate: new Date(),
                    lastSyncDate: new Date()
                });
                
                console.log(`✅ Successfully re-registered: ${certificate.certificateId}`);
                return { success: true, certificateId: certificate.certificateId };
            } else {
                console.error(`❌ Failed to re-register ${certificate.certificateId}:`, result.error);
                return { success: false, certificateId: certificate.certificateId, error: result.error };
            }
            
        } catch (error) {
            console.error(`❌ Error re-registering ${certificate.certificateId}:`, error.message);
            return { success: false, certificateId: certificate.certificateId, error: error.message };
        }
    }
    
    /**
     * Sync all missing certificates
     */
    async syncMissingCertificates() {
        try {
            console.log('🔄 Starting certificate sync process...');
            
            const syncCheck = await this.checkSyncNeeded();
            
            if (!syncCheck.syncNeeded) {
                console.log('✅ All certificates are already synced with blockchain');
                return { success: true, synced: 0, failed: 0 };
            }
            
            console.log(`📋 Found ${syncCheck.missing} certificates to sync out of ${syncCheck.total} total`);
            
            const results = {
                synced: 0,
                failed: 0,
                errors: []
            };
            
            // Re-register certificates in batches to avoid overwhelming the blockchain
            const batchSize = 5;
            const certificates = syncCheck.certificates;
            
            for (let i = 0; i < certificates.length; i += batchSize) {
                const batch = certificates.slice(i, i + batchSize);
                console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(certificates.length/batchSize)}`);
                
                const batchPromises = batch.map(cert => this.reRegisterCertificate(cert));
                const batchResults = await Promise.all(batchPromises);
                
                for (const result of batchResults) {
                    if (result.success) {
                        results.synced++;
                    } else {
                        results.failed++;
                        results.errors.push(`${result.certificateId}: ${result.error}`);
                    }
                }
                
                // Small delay between batches
                if (i + batchSize < certificates.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            console.log(`🎉 Sync completed: ${results.synced} synced, ${results.failed} failed`);
            
            return {
                success: true,
                synced: results.synced,
                failed: results.failed,
                errors: results.errors
            };
            
        } catch (error) {
            console.error('❌ Certificate sync failed:', error.message);
            return {
                success: false,
                error: error.message,
                synced: 0,
                failed: 0
            };
        }
    }
}

export default new CertificateSyncService();
