'use server';

export interface SignatureVerificationResult {
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
  signatureVerification?: SignatureVerificationResult;
  certificate?: {
    certificateId: string;
    studentName: string;
    courseName: string;
    institutionName: string;
    issueDate: string;
    isVerified: boolean;
    verificationDate?: string;
    verificationCount?: number;
  };
  blockchain?: {
    verified: boolean;
    message: string;
  };
  error?: string;
}

export async function verifyWithBackendAction(
  formData: FormData
): Promise<ComprehensiveVerificationResult> {
  const file = formData.get('certificate') as File | null;
  const certificateId = formData.get('certificateId') as string | null;

  if (!file) {
    return { 
      success: false, 
      documentCheck: false,
      blockchainVerification: false,
      integrityCheck: false,
      error: 'No file provided.' 
    };
  }

  if (!certificateId) {
    return { 
      success: false, 
      documentCheck: false,
      blockchainVerification: false,
      integrityCheck: false,
      error: 'Certificate ID is required.' 
    };
  }

  try {
    // Create form data for backend API call
    const backendFormData = new FormData();
    backendFormData.append('certificateFile', file);
    backendFormData.append('certificateId', certificateId);

    // Make API call to enhanced certificate verification endpoint
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/enhanced-certificates/verify/${certificateId}`, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        documentCheck: true,
        blockchainVerification: result.blockchain?.verified || false,
        integrityCheck: true,
        signatureVerification: result.signatureVerification,
        certificate: result.certificate,
        blockchain: result.blockchain
      };
    } else {
      return {
        success: false,
        documentCheck: false,
        blockchainVerification: false,
        integrityCheck: false,
        error: result.error || 'Verification failed'
      };
    }

  } catch (error) {
    console.error('Backend verification error:', error);
    return {
      success: false,
      documentCheck: false,
      blockchainVerification: false,
      integrityCheck: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during verification.',
    };
  }
}