'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, X, Loader2, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { verifyCertificateAction } from '@/app/actions';

// Define our own verification result interface for this component
interface VerificationResultData {
  extraction: any | null;
  forgery: any | null;
  error?: string;
}
import { VerificationResultDisplay } from './verification-result-display';

interface CertificateInfo {
  certificateId: string;
  studentName: string;
  rollNumber: string;
  course: string;
  grade: string;
  institution: string;
  issueDate: string;
  verificationStatus: string;
  isBlacklisted: boolean;
  fraudScore: number;
  blockchain: {
    isRegistered: boolean;
    transactionHash?: string;
  };
}

export function EnhancedVerifyCertificateForm() {
  // File upload states
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  // Search states
  const [searchForm, setSearchForm] = useState({
    studentName: '',
    rollNumber: '',
    institutionCode: '',
    course: ''
  });
  const [foundCertificates, setFoundCertificates] = useState<CertificateInfo[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateInfo | null>(null);
  
  // Common states
  const [result, setResult] = useState<VerificationResultData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload a file smaller than 5MB.',
        });
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'application/pdf': [] },
    maxFiles: 1,
  });

  const handleRemoveFile = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const handleFileVerify = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please upload a certificate file to verify.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const verificationResult = await verifyCertificateAction(formData);
      setResult(verificationResult);
      
      if (verificationResult.extraction || verificationResult.forgery) {
        toast({
          title: 'Analysis Complete',
          description: 'Certificate has been analyzed successfully.',
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

  const handleSearchCertificates = async () => {
    if (!searchForm.studentName && !searchForm.rollNumber) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please enter at least student name or roll number.',
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/certificates/find-by-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchForm),
      });

      const data = await response.json();

      if (data.success) {
        setFoundCertificates(data.certificates);
        if (data.certificates.length === 0) {
          toast({
            title: 'No Results',
            description: 'No certificates found with the provided details.',
          });
        } else {
          toast({
            title: 'Search Complete',
            description: `Found ${data.certificates.length} certificate(s).`,
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Search Failed',
          description: data.message || 'Failed to search certificates.',
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred while searching for certificates.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleCertificateSelect = (certificate: CertificateInfo) => {
    setSelectedCertificate(certificate);
    
    // Create a mock verification result for display
    const mockResult: VerificationResultData = {
      extraction: {
        isValid: !certificate.isBlacklisted && certificate.verificationStatus === 'verified',
        extractedData: {
          certificateId: certificate.certificateId,
          studentName: certificate.studentName,
          rollNumber: certificate.rollNumber,
          course: certificate.course,
          grade: certificate.grade,
          institution: certificate.institution,
          issueDate: certificate.issueDate
        },
        confidence: 1 - certificate.fraudScore,
        anomalies: certificate.isBlacklisted ? ['Certificate is blacklisted'] : []
      },
      forgery: {
        isForged: certificate.isBlacklisted || certificate.fraudScore > 0.5,
        confidence: 1 - certificate.fraudScore,
        analysis: `Verification status: ${certificate.verificationStatus}`
      }
    };
    
    setResult(mockResult);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload & Verify
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search by Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Certificate File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!file ? (
                  <div
                    {...getRootProps()}
                    className={`flex justify-center rounded-lg border-2 border-dashed border-border p-12 text-center transition-colors ${
                      isDragActive ? 'border-primary bg-primary/10' : 'hover:border-primary/50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="space-y-2 text-muted-foreground">
                      <UploadCloud className="mx-auto h-12 w-12" />
                      <p className="text-lg font-semibold">
                        {isDragActive
                          ? 'Drop the file here...'
                          : 'Drag & drop a file here, or click to select'}
                      </p>
                      <p className="text-sm">PNG, JPG, or PDF (max. 5MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full max-w-sm mx-auto">
                    <div className="rounded-lg border p-4 flex flex-col items-center gap-2">
                      {file?.type.startsWith('image/') ? (
                        <img src={preview || ''} alt="Certificate preview" className="max-h-48 rounded-md" />
                      ) : (
                        <FileText className="h-24 w-24 text-muted-foreground" />
                      )}
                      <p className="text-sm font-medium truncate max-w-full">{file?.name}</p>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-3 -right-3 h-7 w-7 rounded-full"
                      onClick={handleRemoveFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <div className="flex justify-center">
                  <Button
                    onClick={handleFileVerify}
                    disabled={!file || isLoading}
                    className="min-w-32"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Verify Certificate'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search by Student Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName">Student Name</Label>
                  <Input
                    id="studentName"
                    placeholder="Enter student name"
                    value={searchForm.studentName}
                    onChange={(e) => setSearchForm({ ...searchForm, studentName: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input
                    id="rollNumber"
                    placeholder="Enter roll number"
                    value={searchForm.rollNumber}
                    onChange={(e) => setSearchForm({ ...searchForm, rollNumber: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="course">Course (Optional)</Label>
                  <Input
                    id="course"
                    placeholder="Enter course name"
                    value={searchForm.course}
                    onChange={(e) => setSearchForm({ ...searchForm, course: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="institutionCode">Institution Code (Optional)</Label>
                  <Input
                    id="institutionCode"
                    placeholder="Enter institution code"
                    value={searchForm.institutionCode}
                    onChange={(e) => setSearchForm({ ...searchForm, institutionCode: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex justify-center mt-6">
                <Button
                  onClick={handleSearchCertificates}
                  disabled={isSearching}
                  className="min-w-32"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search Certificates
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {foundCertificates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Found Certificates ({foundCertificates.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {foundCertificates.map((cert, index) => (
                    <div
                      key={cert.certificateId}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedCertificate?.certificateId === cert.certificateId
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => handleCertificateSelect(cert)}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Student:</span> {cert.studentName}
                        </div>
                        <div>
                          <span className="font-medium">Roll No:</span> {cert.rollNumber}
                        </div>
                        <div>
                          <span className="font-medium">Course:</span> {cert.course}
                        </div>
                        <div>
                          <span className="font-medium">Grade:</span> {cert.grade}
                        </div>
                        <div>
                          <span className="font-medium">Status:</span> 
                          <span className={`ml-1 px-2 py-1 rounded text-xs ${
                            cert.isBlacklisted 
                              ? 'bg-red-100 text-red-800' 
                              : cert.verificationStatus === 'verified'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {cert.isBlacklisted ? 'Blacklisted' : cert.verificationStatus}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Blockchain:</span> 
                          <span className={`ml-1 px-2 py-1 rounded text-xs ${
                            cert.blockchain.isRegistered 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {cert.blockchain.isRegistered ? 'Registered' : 'Not Registered'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {isLoading && (
        <div className="flex justify-center items-center flex-col gap-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-semibold">Performing AI Analysis...</p>
          <p className="text-muted-foreground">This may take a moment. Please wait.</p>
        </div>
      )}

      {result && <VerificationResultDisplay result={result} />}
    </div>
  );
}
