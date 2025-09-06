import express from 'express';
import {
  registerCertificate,
  registerCertificatesBatch,
  verifyCertificate,
  getCertificate,
  checkCertificateExists,
  registerInstitution,
  getInstitution,
  blacklistCertificate,
  checkBlacklisted,
  getNetworkInfo,
  downloadWatermarkedCertificate,
  getCertificateWithStorage,
  listVerifiedCertificates,
  uploadMiddleware,
  uploadBatchMiddleware
} from '../controllers/blockchain.controller.js';

const router = express.Router();

// Certificate routes
router.post('/certificates/register', uploadMiddleware, registerCertificate);
router.post('/certificates/batch', uploadBatchMiddleware, registerCertificatesBatch);
router.post('/certificates/verify/:certId', uploadMiddleware, verifyCertificate);
router.get('/certificates/:certId', getCertificate);
router.get('/certificates/:certId/full', getCertificateWithStorage);
router.get('/certificates/:certId/download', downloadWatermarkedCertificate);
router.get('/certificates/:certId/exists', checkCertificateExists);
router.post('/certificates/:certId/blacklist', blacklistCertificate);
router.get('/certificates/:certId/blacklisted', checkBlacklisted);

// List all verified certificates
router.get('/certificates', listVerifiedCertificates);

// Institution routes
router.post('/institutions/register', registerInstitution);
router.get('/institutions/:institutionCode', getInstitution);

// Network info
router.get('/network/info', getNetworkInfo);

export default router;
