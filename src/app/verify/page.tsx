'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Search, 
  CheckCircle, 
  XCircle,
  Loader2,
  ArrowLeft,
  FileText,
  Calendar,
  Building,
  User,
  Hash
} from 'lucide-react';

interface VerificationResult {
  isValid: boolean;
  certificate?: {
    studentName: string;
    courseName: string;
    institutionName: string;
    issueDate: string;
    verificationCount: number;
  };
  documentIntegrity?: {
    verified: boolean;
    message: string;
  };
  transactionHash?: string;
  error?: string;
}

export default function VerifyPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  
  const [form, setForm] = useState({
    certificateId: '',
    file: null as File | null
  });

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      const formData = new FormData();
      formData.append('certificateId', form.certificateId);
      
      if (form.file) {
        formData.append('certificateFile', form.file);
      }

      const response = await fetch('http://localhost:5000/api/certificates/verify', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setVerificationResult(data);

      if (!response.ok && response.status !== 404) {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/landing" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-xl text-gray-900">CertiCheck</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <Link href="/landing" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Verify Certificate
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Instantly verify the authenticity of academic certificates using our blockchain-powered verification system
          </p>
        </div>

        {/* Verification Form */}
        <Card className="shadow-lg border-0 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Certificate Verification
            </CardTitle>
            <CardDescription>
              Enter the certificate ID and optionally upload the certificate file for document integrity verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <Label htmlFor="certificateId" className="text-base font-medium">
                  Certificate ID *
                </Label>
                <Input
                  id="certificateId"
                  value={form.certificateId}
                  onChange={(e) => setForm({...form, certificateId: e.target.value})}
                  placeholder="Enter certificate ID (e.g., CERT_1234567890)"
                  required
                  disabled={loading}
                  className="mt-2 text-lg py-3"
                />
                <p className="text-sm text-gray-500 mt-1">
                  The unique identifier found on your certificate
                </p>
              </div>
              
              <div>
                <Label htmlFor="certificateFile" className="text-base font-medium">
                  Certificate File (Optional)
                </Label>
                <Input
                  id="certificateFile"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setForm({...form, file: e.target.files?.[0] || null})}
                  disabled={loading}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload the certificate file to verify document integrity and detect tampering
                </p>
              </div>
              
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying Certificate...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Verify Certificate
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Verification Result */}
        {verificationResult && (
          <Card className={`shadow-lg border-0 ${
            verificationResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                {verificationResult.isValid ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                    <span className="text-green-800">Certificate Verified Successfully</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-red-600 mr-3" />
                    <span className="text-red-800">Certificate Verification Failed</span>
                  </>
                )}
              </CardTitle>
              <CardDescription className={verificationResult.isValid ? 'text-green-700' : 'text-red-700'}>
                {verificationResult.isValid 
                  ? 'This certificate has been successfully verified on the blockchain'
                  : 'This certificate could not be verified or does not exist in our records'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verificationResult.isValid && verificationResult.certificate ? (
                <div className="space-y-6">
                  {/* Certificate Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <User className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Student Name</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {verificationResult.certificate.studentName}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Course</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {verificationResult.certificate.courseName}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Building className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Institution</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {verificationResult.certificate.institutionName}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Issue Date</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {new Date(verificationResult.certificate.issueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Verification Count:</span>
                      <Badge variant="secondary">
                        {verificationResult.certificate.verificationCount} times verified
                      </Badge>
                    </div>
                    
                    {verificationResult.documentIntegrity && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Document Integrity:</span>
                        <Badge variant={verificationResult.documentIntegrity.verified ? 'default' : 'destructive'}>
                          {verificationResult.documentIntegrity.verified ? 'Verified' : 'Tampered'}
                        </Badge>
                      </div>
                    )}
                    
                    {verificationResult.transactionHash && (
                      <div className="flex items-start space-x-3">
                        <Hash className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-700">Blockchain Transaction</p>
                          <p className="text-xs text-gray-500 font-mono break-all">
                            {verificationResult.transactionHash}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-red-800 mb-2">
                    Certificate Not Found
                  </p>
                  <p className="text-red-700">
                    {verificationResult.error || 'The certificate ID you entered does not exist in our blockchain records.'}
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    Please check the certificate ID and try again.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* How It Works Section */}
        <Card className="mt-12 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-center">How Certificate Verification Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Enter Certificate ID</h3>
                <p className="text-sm text-gray-600">
                  Input the unique certificate identifier found on your certificate
                </p>
              </div>
              
              <div>
                <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Blockchain Lookup</h3>
                <p className="text-sm text-gray-600">
                  Our system queries the blockchain for certificate authenticity
                </p>
              </div>
              
              <div>
                <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Instant Results</h3>
                <p className="text-sm text-gray-600">
                  Get immediate verification results with detailed certificate information
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
