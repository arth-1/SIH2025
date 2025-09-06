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
