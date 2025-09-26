import type { VerificationResult, ComprehensiveVerificationResult } from '@/app/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from './ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, FileText, Fingerprint, ListChecks, PenTool, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Separator } from './ui/separator';

type SignatureVerification = {
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
};

type ExtendedVerificationResult = VerificationResult & {
  signatureVerification?: SignatureVerification;
};

type VerificationResultDisplayProps = {
  result: ExtendedVerificationResult;
};

export function VerificationResultDisplay({ result }: VerificationResultDisplayProps) {
  const { extraction, forgery, signatureVerification } = result;
  
  const isForged = forgery?.isForged ?? false;
  const hasSignatureIssues = signatureVerification && !signatureVerification.overallMatch;
  
  const overallStatus = isForged || hasSignatureIssues ? 'Potentially Forged' : 'Authentic';
  const overallIcon = isForged || hasSignatureIssues ? (
    <XCircle className="h-10 w-10 text-destructive" />
  ) : (
    <CheckCircle2 className="h-10 w-10 text-green-500" />
  );
  
  const hasAnomalies = extraction?.anomalies && extraction.anomalies.length > 0;

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardHeader className={`bg-muted/50 p-6 ${isForged || hasSignatureIssues ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
          <div className="flex items-center gap-4">
            {overallIcon}
            <div>
              <CardTitle className={`text-2xl font-bold ${isForged || hasSignatureIssues ? 'text-destructive' : 'text-green-600'}`}>{overallStatus}</CardTitle>
              <CardDescription className="text-base">
                {isForged || hasSignatureIssues ? 'Our AI analysis indicates a high likelihood of forgery.' : 'This certificate appears to be authentic.'}
                {signatureVerification && (
                  <span className="block mt-1">
                    Signature verification: {signatureVerification.overallMatch ? 'Passed' : 'Failed'} 
                    {signatureVerification.highestConfidenceScore > 0 && 
                      ` (${Math.round(signatureVerification.highestConfidenceScore * 100)}% confidence)`
                    }
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
            {forgery && (
            <Alert variant={isForged ? 'destructive' : 'default'} className={!isForged ? 'bg-green-500/10 border-green-500/20' : ''}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>AI Forgery Analysis</AlertTitle>
                <AlertDescription>
                {forgery.explanation} (Confidence: {Math.round(forgery.confidenceScore * 100)}%)
                </AlertDescription>
            </Alert>
            )}
            
            {signatureVerification && (
              <Alert variant={signatureVerification.overallMatch ? 'default' : 'destructive'} className={signatureVerification.overallMatch ? 'bg-green-500/10 border-green-500/20' : ''}>
                <PenTool className="h-4 w-4" />
                <AlertTitle>Signature Verification</AlertTitle>
                <AlertDescription>
                  {signatureVerification.error ? (
                    `Error during signature verification: ${signatureVerification.error}`
                  ) : (
                    <>
                      {signatureVerification.overallMatch 
                        ? `Signature verification passed with ${Math.round(signatureVerification.highestConfidenceScore * 100)}% confidence.`
                        : `Signature verification failed. Highest confidence: ${Math.round(signatureVerification.highestConfidenceScore * 100)}%.`
                      }
                      {signatureVerification.signatureCount > 0 && (
                        <span className="block mt-1">
                          Found {signatureVerification.signatureCount} signature{signatureVerification.signatureCount !== 1 ? 's' : ''} in the document.
                        </span>
                      )}
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
             {hasAnomalies && (
                <Alert variant="destructive">
                    <ListChecks className="h-4 w-4" />
                    <AlertTitle>Detected Anomalies</AlertTitle>
                    <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                        {extraction?.anomalies.map((anomaly, index) => <li key={index}>{anomaly}</li>)}
                    </ul>
                    </AlertDescription>
                </Alert>
            )}
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <CardTitle>Extracted Information</CardTitle>
                </div>
                <CardDescription>Data extracted from the certificate via OCR.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {extraction?.extractedData ? (
                    Object.entries(extraction.extractedData).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center text-sm">
                            <span className="font-medium capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="font-mono text-foreground text-right">{value}</span>
                        </div>
                    ))
                ) : (
                    <p className="text-muted-foreground text-sm">Could not extract data from the document.</p>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                 <div className="flex items-center gap-3">
                    <Fingerprint className="h-6 w-6 text-primary" />
                    <CardTitle>AI Forgery Details</CardTitle>
                </div>
                <CardDescription>Detailed analysis from the forgery detection model.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-muted-foreground">Forgery Detected</span>
                     <Badge variant={isForged ? "destructive" : "default"} className={!isForged ? 'bg-green-500/20 text-green-700' : ''}>{isForged ? 'Yes' : 'No'}</Badge>
                </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-muted-foreground">Confidence Score</span>
                    <span className="font-mono font-semibold">{forgery ? `${Math.round(forgery.confidenceScore * 100)}%` : 'N/A'}</span>
                </div>
                <Separator />
                <div>
                     <h4 className="font-medium mb-2 text-sm">AI Explanation:</h4>
                     <p className="text-sm text-muted-foreground">{forgery?.explanation || 'No detailed explanation available.'}</p>
                </div>
            </CardContent>
        </Card>
      </div>
      
      {signatureVerification && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <PenTool className="h-6 w-6 text-primary" />
              <CardTitle>Signature Verification Details</CardTitle>
            </div>
            <CardDescription>AI-powered signature analysis and comparison results.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-muted-foreground">Overall Match</span>
                <Badge variant={signatureVerification.overallMatch ? "default" : "destructive"} 
                       className={signatureVerification.overallMatch ? 'bg-green-500/20 text-green-700' : ''}>
                  {signatureVerification.overallMatch ? 'Pass' : 'Fail'}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-muted-foreground">Highest Confidence</span>
                <span className="font-mono font-semibold">
                  {Math.round(signatureVerification.highestConfidenceScore * 100)}%
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-muted-foreground">Signatures Found</span>
                <span className="font-mono font-semibold">{signatureVerification.signatureCount}</span>
              </div>
            </div>
            
            {signatureVerification.signatureResults && signatureVerification.signatureResults.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3 text-sm">Individual Signature Results:</h4>
                  <div className="space-y-2">
                    {signatureVerification.signatureResults.map((sig, index) => (
                      <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Signature {sig.signatureIndex + 1}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono">{Math.round(sig.confidenceScore * 100)}%</span>
                          <Badge variant={sig.isMatch ? "default" : "secondary"} 
                                 className={sig.isMatch ? 'bg-green-500/20 text-green-700' : 'bg-gray-500/20'}>
                            {sig.isMatch ? 'Match' : 'No Match'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {signatureVerification.error && (
              <>
                <Separator />
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Verification Error</AlertTitle>
                  <AlertDescription>{signatureVerification.error}</AlertDescription>
                </Alert>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
