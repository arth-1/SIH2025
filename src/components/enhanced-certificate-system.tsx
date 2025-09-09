"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Search,
  Download,
  Shield,
  Brain,
  Users,
  BarChart3
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface UploadMetadata {
  institutionCode: string;
  institutionName?: string;
}

interface CertificateUploadSectionProps {
  onUpload: (files: File[], uploadType: string, metadata: UploadMetadata) => void;
  processing: boolean;
  uploadProgress: number;
}

interface VerificationSectionProps {
  onVerify: (certificateId: string, documentHash?: string) => void;
  verificationResult: any;
  loading: boolean;
}

interface StudentSearchSectionProps {
  onSearch: (rollNumber: string, institutionCode?: string) => void;
  searchResult: any;
  loading: boolean;
}

const CertificateUploadSection: React.FC<CertificateUploadSectionProps> = ({ 
  onUpload, 
  processing, 
  uploadProgress 
}) => {
  const [institutionCode, setInstitutionCode] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [uploadType, setUploadType] = useState('single');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && institutionCode) {
      onUpload(acceptedFiles, uploadType, { institutionCode, institutionName });
    }
  }, [onUpload, institutionCode, institutionName, uploadType]);

  // Simplified drag and drop (replacing react-dropzone for now)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && institutionCode) {
      onUpload(files, uploadType, { institutionCode, institutionName });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Certificates
        </CardTitle>
        <CardDescription>
          Upload certificates for AI-powered verification and blockchain registration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="institution-code">Institution Code *</Label>
            <Input
              id="institution-code"
              value={institutionCode}
              onChange={(e) => setInstitutionCode(e.target.value)}
              placeholder="e.g., IIT_DELHI"
              disabled={processing}
            />
          </div>
          <div>
            <Label htmlFor="institution-name">Institution Name</Label>
            <Input
              id="institution-name"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder="e.g., Indian Institute of Technology Delhi"
              disabled={processing}
            />
          </div>
        </div>

        <div>
          <Label>Upload Type</Label>
          <div className="flex gap-2 mt-2">
            <Button
              variant={uploadType === 'single' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUploadType('single')}
              disabled={processing}
            >
              Single Certificate
            </Button>
            <Button
              variant={uploadType === 'bulk' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUploadType('bulk')}
              disabled={processing}
            >
              Bulk Upload
            </Button>
          </div>
        </div>

        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          {processing ? (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">Processing certificates...</div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          ) : (
            <div className="space-y-2">
              <FileText className="h-10 w-10 text-gray-400 mx-auto" />
              <p className="text-gray-600 mb-4">
                Select certificate files to upload
              </p>
              <label htmlFor="file-upload" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer">
                <input
                  id="file-upload"
                  type="file"
                  multiple={uploadType === 'bulk'}
                  accept=".jpg,.jpeg,.png,.pdf,.heic"
                  onChange={handleFileChange}
                  disabled={processing || !institutionCode}
                  className="hidden"
                />
                Choose Files
              </label>
              <p className="text-sm text-gray-500">
                Supports: JPG, PNG, PDF, HEIC • {uploadType === 'bulk' ? 'Multiple files' : 'Single file'}
              </p>
              {!institutionCode && (
                <p className="text-sm text-red-500">Please enter institution code first</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const VerificationSection: React.FC<VerificationSectionProps> = ({ 
  onVerify, 
  verificationResult, 
  loading 
}) => {
  const [certificateId, setCertificateId] = useState('');
  const [documentHash, setDocumentHash] = useState('');

  const handleVerify = () => {
    if (certificateId) {
      onVerify(certificateId, documentHash);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Verify Certificate
        </CardTitle>
        <CardDescription>
          Verify certificate authenticity using blockchain and AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="cert-id">Certificate ID *</Label>
          <Input
            id="cert-id"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            placeholder="Enter certificate ID"
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="doc-hash">Document Hash (Optional)</Label>
          <Input
            id="doc-hash"
            value={documentHash}
            onChange={(e) => setDocumentHash(e.target.value)}
            placeholder="SHA256 hash for additional verification"
            disabled={loading}
          />
        </div>
        <Button 
          onClick={handleVerify} 
          disabled={!certificateId || loading}
          className="w-full"
        >
          {loading ? 'Verifying...' : 'Verify Certificate'}
        </Button>

        {verificationResult && (
          <VerificationResultDisplay result={verificationResult} />
        )}
      </CardContent>
    </Card>
  );
};

const VerificationResultDisplay: React.FC<{ result: any }> = ({ result }) => {
  const getStatusIcon = (isValid: boolean) => {
    if (isValid) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      invalid: 'bg-red-100 text-red-800',
      blacklisted: 'bg-gray-100 text-gray-800'
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4 mt-4 p-4 border rounded-lg">
      <div className="flex items-center gap-2">
        {getStatusIcon(result.isValid)}
        <span className="font-semibold">
          {result.isValid ? 'Certificate Valid' : 'Certificate Invalid'}
        </span>
      </div>

      {result.certificate && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Student:</span> {result.certificate.studentName}
          </div>
          <div>
            <span className="font-medium">Roll Number:</span> {result.certificate.rollNumber}
          </div>
          <div>
            <span className="font-medium">Course:</span> {result.certificate.course}
          </div>
          <div>
            <span className="font-medium">Grade:</span> {result.certificate.grade}
          </div>
          <div>
            <span className="font-medium">Institution:</span> {result.certificate.institutionName}
          </div>
          <div>
            <span className="font-medium">Status:</span>
            <Badge className={`ml-2 ${getStatusBadge(result.certificate.verificationStatus)}`}>
              {result.certificate.verificationStatus}
            </Badge>
          </div>
        </div>
      )}

      {result.blockchain && (
        <div className="bg-blue-50 p-3 rounded">
          <div className="font-medium text-blue-800">Blockchain Verification</div>
          <div className="text-sm text-blue-600">
            {result.blockchain.verified ? '✅ Verified on blockchain' : '❌ Not verified on blockchain'}
          </div>
          <div className="text-xs text-blue-500">{result.blockchain.message}</div>
        </div>
      )}

      {result.aiAnalysis && (
        <div className="bg-purple-50 p-3 rounded">
          <div className="font-medium text-purple-800 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Analysis
          </div>
          <div className="text-sm text-purple-600 space-y-1">
            <div>Fraud Score: {(result.aiAnalysis.fraudScore * 100).toFixed(1)}%</div>
            <div>Confidence: {(result.aiAnalysis.confidence * 100).toFixed(1)}%</div>
            {result.aiAnalysis.signatureVerification && (
              <div>
                Signature: 
                <Badge className={`ml-2 ${
                  result.aiAnalysis.signatureVerification.status === 'verified' 
                    ? 'bg-green-100 text-green-800'
                    : result.aiAnalysis.signatureVerification.status === 'fraud'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {result.aiAnalysis.signatureVerification.status}
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StudentSearchSection: React.FC<StudentSearchSectionProps> = ({ 
  onSearch, 
  searchResult, 
  loading 
}) => {
  const [rollNumber, setRollNumber] = useState('');
  const [institutionCode, setInstitutionCode] = useState('');

  const handleSearch = () => {
    if (rollNumber) {
      onSearch(rollNumber, institutionCode);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Student Profile
        </CardTitle>
        <CardDescription>
          Search for student profile and all associated certificates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="roll-search">Roll Number *</Label>
            <Input
              id="roll-search"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="Enter student roll number"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="inst-search">Institution Code</Label>
            <Input
              id="inst-search"
              value={institutionCode}
              onChange={(e) => setInstitutionCode(e.target.value)}
              placeholder="Filter by institution"
              disabled={loading}
            />
          </div>
        </div>
        <Button 
          onClick={handleSearch} 
          disabled={!rollNumber || loading}
          className="w-full"
        >
          {loading ? 'Searching...' : 'Search Student'}
        </Button>

        {searchResult && (
          <StudentProfileDisplay profile={searchResult} />
        )}
      </CardContent>
    </Card>
  );
};

const StudentProfileDisplay: React.FC<{ profile: any }> = ({ profile }) => {
  return (
    <div className="space-y-4 mt-4 p-4 border rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="font-medium">Student Name:</span> {profile.studentName}
        </div>
        <div>
          <span className="font-medium">Roll Number:</span> {profile.rollNumber}
        </div>
        <div>
          <span className="font-medium">Institution:</span> {profile.institutionName}
        </div>
        <div>
          <span className="font-medium">Total Certificates:</span> {profile.totalCertificates}
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded">
        <div className="font-medium mb-2">Risk Assessment</div>
        <div className="text-sm">
          Overall Risk Score: {(profile.overallRiskScore * 100).toFixed(1)}%
        </div>
      </div>

      <div>
        <div className="font-medium mb-2">Certificates</div>
        <div className="space-y-2">
          {profile.certificates.map((cert: any, index: number) => (
            <div key={index} className="flex justify-between items-center p-2 bg-white border rounded">
              <div>
                <div className="font-medium">{cert.course}</div>
                <div className="text-sm text-gray-600">
                  {cert.certificateId} • Grade: {cert.grade}
                </div>
              </div>
              <Badge className={`${
                cert.isBlacklisted ? 'bg-gray-100 text-gray-800' :
                cert.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                cert.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {cert.isBlacklisted ? 'Blacklisted' : cert.verificationStatus}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function EnhancedCertificateSystem() {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>(null);

  const handleUpload = async (files: File[], uploadType: string, metadata: UploadMetadata) => {
    setProcessing(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      if (uploadType === 'bulk') {
        files.forEach(file => formData.append('certificates', file));
        formData.append('institutionCode', metadata.institutionCode);
        if (metadata.institutionName) {
          formData.append('institutionName', metadata.institutionName);
        }

        const response = await fetch(`${API_BASE}/ai-certificates/upload/bulk`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        setUploadResults(result);
      } else {
        formData.append('certificate', files[0]);
        formData.append('institutionCode', metadata.institutionCode);
        if (metadata.institutionName) {
          formData.append('institutionName', metadata.institutionName);
        }

        const response = await fetch(`${API_BASE}/ai-certificates/upload`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        setUploadResults([result]);
      }

      setUploadProgress(100);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResults({ error: (error as Error).message });
    } finally {
      setProcessing(false);
    }
  };

  const handleVerification = async (certificateId: string, documentHash?: string) => {
    setVerificationLoading(true);
    setVerificationResult(null);

    try {
      const url = `${API_BASE}/ai-certificates/verify/${certificateId}${documentHash ? `?documentHash=${documentHash}` : ''}`;
      const response = await fetch(url);
      const result = await response.json();
      setVerificationResult(result);
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({ error: (error as Error).message });
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleStudentSearch = async (rollNumber: string, institutionCode?: string) => {
    setSearchLoading(true);
    setSearchResult(null);

    try {
      const url = `${API_BASE}/ai-certificates/student/${rollNumber}${institutionCode ? `?institutionCode=${institutionCode}` : ''}`;
      const response = await fetch(url);
      const result = await response.json();
      setSearchResult(result.profile);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResult({ error: (error as Error).message });
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Certificate Authenticity Validator</h1>
        <p className="text-gray-600">
          AI-powered certificate verification with blockchain security
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="verify">Verify</TabsTrigger>
          <TabsTrigger value="search">Student Search</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <CertificateUploadSection
            onUpload={handleUpload}
            processing={processing}
            uploadProgress={uploadProgress}
          />
          
          {uploadResults && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Results</CardTitle>
              </CardHeader>
              <CardContent>
                {uploadResults.error ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{uploadResults.error}</AlertDescription>
                  </Alert>
                ) : Array.isArray(uploadResults) ? (
                  <div className="space-y-4">
                    {uploadResults.map((result: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="font-medium">
                            {result.success ? 'Successfully processed' : 'Processing failed'}
                          </span>
                        </div>
                        {result.success && (
                          <div className="text-sm space-y-1">
                            <div>Certificate ID: {result.certificateId}</div>
                            <div>Student: {result.certificate?.studentName}</div>
                            <div>Fraud Score: {((result.aiAnalysis?.fraudScore || 0) * 100).toFixed(1)}%</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-600">
                    Processed {uploadResults.processed}/{uploadResults.total} certificates
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="verify">
          <VerificationSection
            onVerify={handleVerification}
            verificationResult={verificationResult}
            loading={verificationLoading}
          />
        </TabsContent>

        <TabsContent value="search">
          <StudentSearchSection
            onSearch={handleStudentSearch}
            searchResult={searchResult}
            loading={searchLoading}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                System Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-600">
                Analytics dashboard coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
