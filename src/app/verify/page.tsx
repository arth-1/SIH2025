'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
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
  BarChart3,
  Loader2,
  Trash2,
  Plus
} from 'lucide-react';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: any;
  error?: string;
}

interface ProcessedCertificate {
  fileName: string;
  certificateId?: string;
  extractedData: {
    studentName?: string;
    rollNumber?: string;
    course?: string;
    grade?: string;
    institution?: string;
    issueDate?: string;
  };
  verification: {
    blockchainRegistered: boolean;
    aiVerified: boolean;
    documentIntegrity: boolean;
  };
  status: 'success' | 'warning' | 'error';
  message: string;
}

export default function BulkVerifyPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState<ProcessedCertificate[]>([]);
  const [institutionCode, setInstitutionCode] = useState('');
  const [institutionName, setInstitutionName] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending'
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: true
  });

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const processBulkUpload = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }

    if (!institutionCode.trim()) {
      alert('Please enter institution code');
      return;
    }

    setProcessing(true);
    setUploadProgress(0);
    setResults([]);

    const totalFiles = uploadedFiles.length;
    const processedResults: ProcessedCertificate[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const fileData = uploadedFiles[i];
      
      // Update file status
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileData.id ? { ...f, status: 'processing' } : f)
      );

      try {
        // Create FormData for this file
        const formData = new FormData();
        formData.append('certificateFile', fileData.file);
        formData.append('institutionCode', institutionCode);
        formData.append('institutionName', institutionName);
        formData.append('bulkUpload', 'true');

        // Send to bulk processing endpoint
        const response = await fetch('http://localhost:5000/api/enhanced-certificates/bulk-process', {
          method: 'POST',
          body: formData
        });

        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error('Failed to parse JSON response:', jsonError);
          const textResponse = await response.text();
          console.error('Response text:', textResponse);
          throw new Error('Invalid response from server');
        }

        if (response.ok) {
          // Update file status to completed
          setUploadedFiles(prev => 
            prev.map(f => f.id === fileData.id ? 
              { ...f, status: 'completed', result } : f
            )
          );

          // Add to results
          processedResults.push({
            fileName: fileData.file.name,
            certificateId: result.certificateId,
            extractedData: result.extractedData || {},
            verification: {
              blockchainRegistered: result.blockchain?.isRegistered || false,
              aiVerified: result.aiAnalysis?.verificationStatus === 'verified' || false,
              documentIntegrity: result.verification?.document?.isValid || false
            },
            status: result.success ? 'success' : 'warning',
            message: result.message || 'Processing completed'
          });
        } else {
          // Update file status to error
          setUploadedFiles(prev => 
            prev.map(f => f.id === fileData.id ? 
              { ...f, status: 'error', error: result.error } : f
            )
          );

          processedResults.push({
            fileName: fileData.file.name,
            extractedData: {},
            verification: {
              blockchainRegistered: false,
              aiVerified: false,
              documentIntegrity: false
            },
            status: 'error',
            message: result.error || 'Processing failed'
          });
        }
      } catch (error) {
        console.error('Error processing file:', error);
        
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileData.id ? 
            { ...f, status: 'error', error: 'Network error' } : f
          )
        );

        processedResults.push({
          fileName: fileData.file.name,
          extractedData: {},
          verification: {
            blockchainRegistered: false,
            aiVerified: false,
            documentIntegrity: false
          },
          status: 'error',
          message: 'Network error occurred'
        });
      }

      // Update progress
      const progress = ((i + 1) / totalFiles) * 100;
      setUploadProgress(progress);
    }

    setResults(processedResults);
    setProcessing(false);
  };

  const downloadResults = () => {
    const csvContent = [
      'File Name,Certificate ID,Student Name,Roll Number,Course,Grade,Institution,Issue Date,Blockchain Registered,AI Verified,Document Integrity,Status,Message',
      ...results.map(r => 
        `"${r.fileName}","${r.certificateId || ''}","${r.extractedData.studentName || ''}","${r.extractedData.rollNumber || ''}","${r.extractedData.course || ''}","${r.extractedData.grade || ''}","${r.extractedData.institution || ''}","${r.extractedData.issueDate || ''}","${r.verification.blockchainRegistered}","${r.verification.aiVerified}","${r.verification.documentIntegrity}","${r.status}","${r.message}"`
      )
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-verification-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Bulk Certificate Processing
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Upload multiple certificates at once for automatic OCR extraction, 
              verification, and blockchain registration. Perfect for universities and institutions.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload & Configure</TabsTrigger>
              <TabsTrigger value="process">Process Files</TabsTrigger>
              <TabsTrigger value="results">View Results</TabsTrigger>
            </TabsList>
            
            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Institution Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure institution details for bulk processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="institution-code">Institution Code *</Label>
                      <Input
                        id="institution-code"
                        value={institutionCode}
                        onChange={(e) => setInstitutionCode(e.target.value)}
                        placeholder="e.g., NMIMS_MPSTME"
                        disabled={processing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="institution-name">Institution Name</Label>
                      <Input
                        id="institution-name"
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        placeholder="e.g., NMIMS School of Technology"
                        disabled={processing}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    File Upload
                  </CardTitle>
                  <CardDescription>
                    Drag and drop or click to select multiple certificate files (PDF, PNG, JPG)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragActive
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    {isDragActive ? (
                      <p className="text-blue-600">Drop the files here...</p>
                    ) : (
                      <>
                        <p className="text-gray-600 mb-2">
                          Drag and drop certificate files here, or{' '}
                          <span className="text-blue-600 cursor-pointer">click to browse</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports PDF, PNG, JPG files
                        </p>
                      </>
                    )}
                  </div>

                  {/* File List */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Selected Files ({uploadedFiles.length})
                      </h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {uploadedFiles.map((fileData) => (
                          <div
                            key={fileData.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <span className="text-sm font-medium">
                                {fileData.file.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({Math.round(fileData.file.size / 1024)} KB)
                              </span>
                              <Badge 
                                variant={
                                  fileData.status === 'completed' ? 'default' :
                                  fileData.status === 'error' ? 'destructive' :
                                  fileData.status === 'processing' ? 'secondary' : 'outline'
                                }
                              >
                                {fileData.status}
                              </Badge>
                            </div>
                            {fileData.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(fileData.id)}
                                disabled={processing}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Process Tab */}
            <TabsContent value="process" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Bulk Processing
                  </CardTitle>
                  <CardDescription>
                    Process all uploaded files with OCR extraction and blockchain registration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="mb-4">
                      <p className="text-2xl font-bold text-gray-900">
                        {uploadedFiles.length} Files Ready
                      </p>
                      <p className="text-gray-600">
                        Institution: {institutionCode || 'Not set'}
                      </p>
                    </div>

                    <Button
                      onClick={processBulkUpload}
                      disabled={processing || uploadedFiles.length === 0 || !institutionCode}
                      size="lg"
                      className="w-full max-w-md"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing ({Math.round(uploadProgress)}%)
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-5 w-5" />
                          Start Bulk Processing
                        </>
                      )}
                    </Button>
                  </div>

                  {processing && (
                    <div className="space-y-4">
                      <Progress value={uploadProgress} className="w-full" />
                      <div className="text-center text-sm text-gray-600">
                        Processing files... This may take a few minutes.
                      </div>
                    </div>
                  )}

                  {/* Processing Status */}
                  {uploadedFiles.some(f => f.status !== 'pending') && (
                    <div className="space-y-2">
                      <h3 className="font-semibold">Processing Status:</h3>
                      {uploadedFiles.map((fileData) => (
                        <div key={fileData.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{fileData.file.name}</span>
                          <div className="flex items-center space-x-2">
                            {fileData.status === 'processing' && (
                              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            )}
                            {fileData.status === 'completed' && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            {fileData.status === 'error' && (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <Badge 
                              variant={
                                fileData.status === 'completed' ? 'default' :
                                fileData.status === 'error' ? 'destructive' : 'secondary'
                              }
                            >
                              {fileData.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Processing Results
                    </div>
                    {results.length > 0 && (
                      <Button onClick={downloadResults} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download CSV
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Review the results of bulk certificate processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {results.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No results yet. Process some files first.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="border-green-200 bg-green-50">
                          <CardContent className="pt-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-700">
                                {results.filter(r => r.status === 'success').length}
                              </div>
                              <div className="text-sm text-green-600">Successful</div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-yellow-200 bg-yellow-50">
                          <CardContent className="pt-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-yellow-700">
                                {results.filter(r => r.status === 'warning').length}
                              </div>
                              <div className="text-sm text-yellow-600">Warnings</div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border-red-200 bg-red-50">
                          <CardContent className="pt-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-700">
                                {results.filter(r => r.status === 'error').length}
                              </div>
                              <div className="text-sm text-red-600">Errors</div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Detailed Results */}
                      <div className="space-y-3">
                        {results.map((result, index) => (
                          <Card 
                            key={index} 
                            className={
                              result.status === 'success' ? 'border-green-200 bg-green-50' :
                              result.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                              'border-red-200 bg-red-50'
                            }
                          >
                            <CardContent className="pt-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    {result.fileName}
                                  </h4>
                                  <Badge variant={result.status === 'success' ? 'default' : 
                                                result.status === 'warning' ? 'secondary' : 'destructive'}>
                                    {result.status}
                                  </Badge>
                                </div>

                                {result.certificateId && (
                                  <div className="text-sm">
                                    <strong>Certificate ID:</strong> {result.certificateId}
                                  </div>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <strong>Student:</strong> {result.extractedData.studentName || 'N/A'}
                                  </div>
                                  <div>
                                    <strong>Roll No:</strong> {result.extractedData.rollNumber || 'N/A'}
                                  </div>
                                  <div>
                                    <strong>Course:</strong> {result.extractedData.course || 'N/A'}
                                  </div>
                                  <div>
                                    <strong>Grade:</strong> {result.extractedData.grade || 'N/A'}
                                  </div>
                                </div>

                                <div className="flex space-x-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    {result.verification.blockchainRegistered ? 
                                      <CheckCircle className="h-4 w-4 text-green-600" /> : 
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    }
                                    Blockchain
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {result.verification.aiVerified ? 
                                      <CheckCircle className="h-4 w-4 text-green-600" /> : 
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    }
                                    AI Verified
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {result.verification.documentIntegrity ? 
                                      <CheckCircle className="h-4 w-4 text-green-600" /> : 
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    }
                                    Document Integrity
                                  </div>
                                </div>

                                <div className="text-sm text-gray-600">
                                  {result.message}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
