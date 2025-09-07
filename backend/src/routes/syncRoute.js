import express from 'express';
import certificateSyncService from '../services/certificateSyncService.js';

const router = express.Router();

/**
 * Manually sync MongoDB certificates to blockchain
 */
router.post('/sync', async (req, res) => {
  try {
    console.log('🔄 Manual certificate sync requested...');
    
    const result = await certificateSyncService.syncMissingCertificates();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Certificate sync completed',
        synced: result.synced,
        failed: result.failed,
        errors: result.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Sync failed'
      });
    }
    
  } catch (error) {
    console.error('❌ Manual sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Check sync status
 */
router.get('/sync/status', async (req, res) => {
  try {
    const status = await certificateSyncService.checkSyncNeeded();
    
    res.json({
      success: true,
      syncNeeded: status.syncNeeded,
      totalCertificates: status.total || 0,
      missingFromBlockchain: status.missing || 0,
      certificates: status.certificates || []
    });
    
  } catch (error) {
    console.error('❌ Sync status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
