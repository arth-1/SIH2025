import type { ComprehensiveVerificationResult } from '@/app/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from './ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, FileText, Fingerprint, ListChecks, PenTool, Shield, Link, Database } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Separator } from './ui/separator';

type ComprehensiveVerificationResultDisplayProps = {
  result: ComprehensiveVerificationResult;
};

export function ComprehensiveVerificationResultDisplay({ result }: ComprehensiveVerificationResultDisplayProps) {
  // Determine overall status based on all verification results
  const getOverallStatus = () => {
    const hasAllBasicChecks = result.documentCheck && result.blockchainVerification && result.integrityCheck;
    const hasSignatureVerification = result.signatureVerification && result.signatureVerification.overallMatch;
    
    if (hasAllBasicChecks && (!result.signatureVerification || hasSignatureVerification)) {
      return { 
        status: 'verified', 
        icon: CheckCircle2, 
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else if (!result.documentCheck || !result.blockchainVerification || !result.integrityCheck || 
               (result.signatureVerification && !result.signatureVerification.overallMatch)) {
      return { 
        status: 'failed', 
        icon: XCircle, 
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    } else {
      return { 
        status: 'warning', 
        icon: AlertTriangle, 
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      };
    }
  };

  const overallStatus = getOverallStatus();
  const StatusIcon = overallStatus.icon;
  const hasSignatureIssues = result.signatureVerification && !result.signatureVerification.overallMatch;

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardHeader className={`bg-muted/50 p-6 ${overallStatus.bgColor}`}>
          <div className="flex items-center gap-4">
            <StatusIcon className={`h-10 w-10 ${overallStatus.color}`} />
            <div>
              <CardTitle className={`text-2xl font-bold ${overallStatus.color}`}>
                {overallStatus.status === 'verified' ? 'Certificate Verified' : 
                 overallStatus.status === 'failed' ? 'Verification Failed' : 'Verification Warning'}
              </CardTitle>
              <CardDescription className="text-base">
                {overallStatus.status === 'verified' 
                  ? 'All verification checks passed successfully.'
                  : overallStatus.status === 'failed'
                  ? 'One or more verification checks failed.'
                  : 'Some verification checks need attention.'
                }
                {result.signatureVerification && (
                  <span className="block mt-1">
                    Signature verification: {result.signatureVerification.overallMatch ? 'Passed' : 'Failed'} 
                    {result.signatureVerification.highestConfidenceScore > 0 && 
                      ` (${Math.round(result.signatureVerification.highestConfidenceScore * 100)}% confidence)`
                    }
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Verification Status Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Document Check</span>
              </div>
              <Badge variant={result.documentCheck ? "default" : "destructive"} 
                     className={result.documentCheck ? 'bg-green-500/20 text-green-700' : ''}>
                {result.documentCheck ? 'Pass' : 'Fail'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Blockchain</span>
              </div>
              <Badge variant={result.blockchainVerification ? "default" : "destructive"} 
                     className={result.blockchainVerification ? 'bg-green-500/20 text-green-700' : ''}>
                {result.blockchainVerification ? 'Pass' : 'Fail'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Integrity</span>
              </div>
              <Badge variant={result.integrityCheck ? "default" : "destructive"} 
                     className={result.integrityCheck ? 'bg-green-500/20 text-green-700' : ''}>
                {result.integrityCheck ? 'Pass' : 'Fail'}
              </Badge>
            </div>
          </div>
          
          {/* Signature Verification Alert */}
          {result.signatureVerification && (
            <Alert variant={result.signatureVerification.overallMatch ? 'default' : 'destructive'} 
                   className={result.signatureVerification.overallMatch ? 'bg-green-500/10 border-green-500/20' : ''}>
              <PenTool className="h-4 w-4" />
              <AlertTitle>AI Signature Verification</AlertTitle>
              <AlertDescription>
                {result.signatureVerification.error ? (
                  `Error during signature verification: ${result.signatureVerification.error}`
                ) : (
                  <>
                    {result.signatureVerification.overallMatch 
                      ? `Signature verification passed with ${Math.round(result.signatureVerification.highestConfidenceScore * 100)}% confidence.`
                      : `Signature verification failed. Highest confidence: ${Math.round(result.signatureVerification.highestConfidenceScore * 100)}%.`
                    }
                    {result.signatureVerification.signatureCount > 0 && (
                      <span className="block mt-1">
                        Found {result.signatureVerification.signatureCount} signature{result.signatureVerification.signatureCount !== 1 ? 's' : ''} in the document.
                      </span>
                    )}
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Certificate Data Display */}
      {result.certificateData && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <CardTitle>Certificate Information</CardTitle>
            </div>
            <CardDescription>Verified certificate data from the blockchain.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(result.certificateData).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center text-sm">
                <span className="font-medium capitalize text-muted-foreground">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
                <span className="font-mono text-foreground text-right max-w-md truncate">{String(value)}</span>
              </div>
            ))}
            
            {/* Display blockchain hash */}
            {result.transactionHash && (
              <div className="flex justify-between items-center text-sm border-t pt-4">
                <span className="font-medium text-muted-foreground">Blockchain Hash</span>
                <span className="font-mono text-foreground text-right text-xs bg-muted p-2 rounded max-w-md truncate">
                  {result.transactionHash}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Detailed Signature Verification Results */}
      {result.signatureVerification && (
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
                <Badge variant={result.signatureVerification.overallMatch ? "default" : "destructive"} 
                       className={result.signatureVerification.overallMatch ? 'bg-green-500/20 text-green-700' : ''}>
                  {result.signatureVerification.overallMatch ? 'Pass' : 'Fail'}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-muted-foreground">Highest Confidence</span>
                <span className="font-mono font-semibold">
                  {Math.round(result.signatureVerification.highestConfidenceScore * 100)}%
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-muted-foreground">Signatures Found</span>
                <span className="font-mono font-semibold">{result.signatureVerification.signatureCount}</span>
              </div>
            </div>
            
            {result.signatureVerification.signatureResults && result.signatureVerification.signatureResults.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3 text-sm">Individual Signature Results:</h4>
                  <div className="space-y-2">
                    {result.signatureVerification.signatureResults.map((sig, index) => (
                      <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Signature {sig.signatureIndex + 1}</span>
                          <Badge 
                            variant={sig.verificationStatus === 'forged' ? 'destructive' : 'default'} 
                            className={sig.verificationStatus === 'forged' ? '' : 'bg-green-500/20 text-green-700'}
                          >
                            {sig.verificationStatus === 'forged' ? 'Forged' : 'Real'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono font-semibold">
                            {Math.round(sig.confidenceScore * 100)}%
                          </span>
                          <Badge variant={sig.isMatch ? "default" : "secondary"} 
                                 className={sig.isMatch ? 'bg-blue-500/20 text-blue-700' : 'bg-gray-500/20'}>
                            {sig.isMatch ? 'Match' : 'No Match'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {result.signatureVerification.error && (
              <>
                <Separator />
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Verification Error</AlertTitle>
                  <AlertDescription>{result.signatureVerification.error}</AlertDescription>
                </Alert>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="text-center text-sm text-muted-foreground">
        Verification completed on {new Date(result.verificationDate).toLocaleString()}
      </div>
    </div>
  );
}