'use server';

import {
  aiPoweredForgeryDetection,
  type ForgeryDetectionOutput,
} from '@/ai/flows/ai-powered-forgery-detection';
import {
  certificateDataExtractionAndAnomalyDetection,
  type CertificateDataExtractionAndAnomalyDetectionOutput,
} from '@/ai/flows/certificate-data-extraction-anomaly-detection';

export interface VerificationResult {
  extraction: CertificateDataExtractionAndAnomalyDetectionOutput | null;
  forgery: ForgeryDetectionOutput | null;
  error?: string;
}

export interface SignatureVerification {
  overallMatch: boolean;
  highestConfidenceScore: number;
  signatureCount: number;
  matchingSignatures?: number;
  verificationStatus: string;
  signatureResults: Array<{
    signatureIndex: number;
    confidenceScore: number;
    isMatch: boolean;
    verificationStatus: string;
  }>;
  error?: string;
}

export interface ComprehensiveVerificationResult {
  success: boolean;
  documentCheck: boolean;
  blockchainVerification: boolean;
  integrityCheck: boolean;
  signatureVerification?: SignatureVerification;
  certificateData?: any;
  blockchainData?: any;
  transactionHash?: string;
  verificationDate: string;
  error?: string;
}

export async function verifyCertificateAction(
  formData: FormData
): Promise<VerificationResult> {
  const file = formData.get('certificate') as File | null;

  if (!file) {
    return { extraction: null, forgery: null, error: 'No file provided.' };
  }

  try {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    // Run both AI flows in parallel for efficiency
    const [extractionResult, forgeryResult] = await Promise.allSettled([
      certificateDataExtractionAndAnomalyDetection({ certificateDataUri: dataUri }),
      aiPoweredForgeryDetection({ certificateDataUri: dataUri }),
    ]);

    const extraction =
      extractionResult.status === 'fulfilled' ? extractionResult.value : null;
    const forgery =
      forgeryResult.status === 'fulfilled' ? forgeryResult.value : null;
      
    if (extractionResult.status === 'rejected') {
        console.error("Extraction failed:", extractionResult.reason);
    }
    if (forgeryResult.status === 'rejected') {
        console.error("Forgery detection failed:", forgeryResult.reason);
    }

    if (!extraction && !forgery) {
      return { extraction: null, forgery: null, error: 'Both AI analysis processes failed. Please try again.' };
    }

    return { extraction, forgery };
  } catch (error) {
    console.error('Error processing certificate:', error);
    return {
      extraction: null,
      forgery: null,
      error: 'An unexpected error occurred during verification.',
    };
  }
}

export async function comprehensiveVerificationAction(
  certificateId: string,
  formData: FormData
): Promise<ComprehensiveVerificationResult> {
  const file = formData.get('certificate') as File | null;

  if (!file) {
    return { 
      success: false,
      documentCheck: false,
      blockchainVerification: false,
      integrityCheck: false,
      verificationDate: new Date().toISOString(),
      error: 'No certificate file provided.' 
    };
  }

  try {
    const backendFormData = new FormData();
    backendFormData.append('certificateFile', file);

    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/enhanced-certificates/verify/${certificateId}`, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      throw new Error(`Backend verification failed: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: result.success || false,
      documentCheck: result.documentCheck || false,
      blockchainVerification: result.blockchainVerification || false,
      integrityCheck: result.integrityCheck || false,
      signatureVerification: result.signatureVerification,
      certificateData: result.certificateData,
      blockchainData: result.blockchainData,
      transactionHash: result.transactionHash,
      verificationDate: result.verificationDate || new Date().toISOString(),
      error: result.error
    };

  } catch (error) {
    console.error('Error during comprehensive verification:', error);
    return {
      success: false,
      documentCheck: false,
      blockchainVerification: false,
      integrityCheck: false,
      verificationDate: new Date().toISOString(),
      error: 'Failed to perform comprehensive verification. Please try again.',
    };
  }
}
