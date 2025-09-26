'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Loader2, Search, Shield } from 'lucide-react';
import { VerificationResultDisplay } from './verification-result-display';
import { verifyWithBackendAction, type ComprehensiveVerificationResult } from '@/app/backend-actions';

export function ComprehensiveVerifyCertificateForm() {
  const [file, setFile] = useState<File | null>(null);
  const [certificateId, setCertificateId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ComprehensiveVerificationResult | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null); // Clear previous results
    }
  };

  const handleVerify = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please upload a certificate file to verify.',
      });
      return;
    }

    if (!certificateId.trim()) {
      toast({
        variant: 'destructive',
        title: 'Certificate ID required',
        description: 'Please enter a certificate ID to verify.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('certificate', file);
      formData.append('certificateId', certificateId.trim());
      
      const verificationResult = await verifyWithBackendAction(formData);
      setResult(verificationResult);
      
      if (verificationResult.success) {
        toast({
          title: 'Verification Complete',
          description: 'Certificate has been comprehensively verified with signature analysis.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Verification Failed',
          description: verificationResult.error || 'Failed to verify certificate.',
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred while verifying the certificate.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Convert backend result to frontend format for display
  const convertResultForDisplay = (backendResult: ComprehensiveVerificationResult) => {
    if (!backendResult.success) {
      return {
        extraction: null,
        forgery: { 
          isForged: true, 
          confidenceScore: 0.9, 
          explanation: backendResult.error || 'Verification failed' 
        },
        signatureVerification: backendResult.signatureVerification
      };
    }

    return {
      extraction: backendResult.certificate ? {
        extractedData: {
          name: backendResult.certificate.studentName,
          rollNumber: backendResult.certificate.certificateId, // Using certificateId as rollNumber for display
          marks: 'N/A', // Backend doesn't provide marks
          certificateId: backendResult.certificate.certificateId,
          institution: backendResult.certificate.institutionName
        },
        anomalies: backendResult.success ? [] : ['Verification failed']
      } : null,
      forgery: {
        isForged: !backendResult.success,
        confidenceScore: backendResult.success ? 0.1 : 0.9,
        explanation: backendResult.success 
          ? 'Certificate passed all verification checks including blockchain and signature verification'
          : backendResult.error || 'Certificate verification failed'
      },
      signatureVerification: backendResult.signatureVerification
    };
  };

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Comprehensive Certificate Verification</CardTitle>
          <CardDescription className="text-lg">
            Upload a certificate and enter its ID for complete verification including blockchain, database, and AI-powered signature analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="certificate-id" className="text-base font-medium">
              Certificate ID
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="certificate-id"
                placeholder="Enter certificate ID (e.g., CERT-2024-001)"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificate-upload" className="text-base font-medium">
              Certificate File
            </Label>
            <div className="relative">
              <Input
                id="certificate-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {file && (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{file.name}</span>
                  <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={handleVerify} 
            disabled={!file || !certificateId.trim() || isLoading}
            className="w-full h-12 text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying Certificate...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Verify Certificate
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Supported formats: PDF, JPG, PNG</p>
            <p>• Maximum file size: 10MB</p>
            <p>• This process includes blockchain verification, database checks, and AI signature analysis</p>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="w-full max-w-4xl mx-auto">
          <VerificationResultDisplay result={convertResultForDisplay(result)} />
        </div>
      )}
    </div>
  );
}