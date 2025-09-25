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
import { motion } from 'motion/react';
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
  Plus,
  Zap,
  Lock,
  Building
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

export default function ModernBulkVerifyPage() {
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
      const uploadFile = uploadedFiles[i];
      
      // Update file status to processing
      setUploadedFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'processing' as const }
          : f
      ));
      
      try {
        const formData = new FormData();
        formData.append('certificates', uploadFile.file);
        formData.append('institutionCode', institutionCode);
        formData.append('institutionName', institutionName);

        const response = await fetch('/api/verify/bulk', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        
        if (response.ok && result.results && result.results.length > 0) {
          const certificateResult = result.results[0];
          processedResults.push(certificateResult);
          
          // Update file status to completed
          setUploadedFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'completed' as const, result: certificateResult }
              : f
          ));
        } else {
          throw new Error(result.error || 'Processing failed');
        }
      } catch (error: any) {
        // Update file status to error
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'error' as const, error: error.message }
            : f
        ));
      }
      
      // Update progress
      setUploadProgress(((i + 1) / totalFiles) * 100);
    }
    
    setResults(processedResults);
    setProcessing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-white bg-rich_black border-white';
      case 'warning': return 'text-white bg-rich_black border-white';
      case 'error': return 'text-red-400 bg-rich_black border-red-500';
      default: return 'text-white bg-rich_black border-oxford_blue';
    }
  };

  const getFileStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-white animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-white" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-rich_black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-600 text-white hover:bg-white/10 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Certificate Verification
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Advanced AI-powered certificate verification with blockchain integration. 
              Verify individual certificates or process multiple certificates in bulk.
            </p>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card className="text-center bg-rich_black border-oxford_blue">
            <CardContent className="pt-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-oxford_blue rounded-full flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">AI-Powered Analysis</h3>
              <p className="text-sm text-gray-400">Advanced OCR and forgery detection using machine learning</p>
            </CardContent>
          </Card>

          <Card className="text-center bg-rich_black border-oxford_blue">
            <CardContent className="pt-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-oxford_blue rounded-full flex items-center justify-center">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Blockchain Verified</h3>
              <p className="text-sm text-gray-400">Immutable verification through blockchain technology</p>
            </CardContent>
          </Card>

          <Card className="text-center bg-rich_black border-oxford_blue">
            <CardContent className="pt-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-oxford_blue rounded-full flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Instant Results</h3>
              <p className="text-sm text-gray-400">Get verification results in seconds, not hours</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="bulk" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-rich_black/50">
              <TabsTrigger value="bulk" className="flex items-center gap-2 text-white data-[state=active]:bg-white data-[state=active]:text-rich_black">
                <Upload className="h-4 w-4" />
                Bulk Verification
              </TabsTrigger>
              <TabsTrigger value="single" className="flex items-center gap-2 text-white data-[state=active]:bg-white data-[state=active]:text-rich_black">
                <Search className="h-4 w-4" />
                Single Verification
              </TabsTrigger>
            </TabsList>
            
            {/* Bulk Verification Tab */}
            <TabsContent value="bulk">
              <div className="space-y-8">
                {/* Institution Details */}
                <Card className="bg-oxford_blue/90 backdrop-blur-sm border-gray-600">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Building className="h-5 w-5" />
                      Institution Details
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Enter your institution details for batch verification
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="institutionCode" className="text-white">Institution Code</Label>
                        <Input
                          id="institutionCode"
                          placeholder="INST_001"
                          value={institutionCode}
                          onChange={(e) => setInstitutionCode(e.target.value)}
                          disabled={processing}
                          className="bg-oxford_blue text-white placeholder:text-gray-400 border-gray-600 focus:border-white focus:ring-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="institutionName" className="text-white">Institution Name (Optional)</Label>
                        <Input
                          id="institutionName"
                          placeholder="University Name"
                          value={institutionName}
                          onChange={(e) => setInstitutionName(e.target.value)}
                          disabled={processing}
                          className="bg-oxford_blue text-white placeholder:text-gray-400 border-gray-600 focus:border-white focus:ring-white"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* File Upload */}
                <Card className="bg-oxford_blue/90 backdrop-blur-sm border-gray-600">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Upload className="h-5 w-5" />
                      Upload Certificates
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Upload multiple certificate files (PDF, PNG, JPG) for batch verification
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        isDragActive 
                          ? 'border-white bg-white/10 backdrop-blur-sm' 
                          : 'border-gray-500 hover:border-white hover:bg-white/5 backdrop-blur-sm'
                      }`}
                    >
                      <input {...getInputProps()} disabled={processing} />
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto bg-oxford_blue/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <Upload className="h-8 w-8 text-white" />
                        </div>
                        {isDragActive ? (
                          <p className="text-white font-medium">Drop the files here...</p>
                        ) : (
                          <>
                            <p className="text-gray-300">
                              <span className="font-medium text-white">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-sm text-gray-400">PDF, PNG, JPG up to 10MB each</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-white">Uploaded Files ({uploadedFiles.length})</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUploadedFiles([])}
                            disabled={processing}
                            className="border-gray-600 text-white hover:bg-white/10"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear All
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {uploadedFiles.map((file) => (
                            <motion.div
                              key={file.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center justify-between p-3 bg-oxford_blue/50 backdrop-blur-sm rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                {getFileStatusIcon(file.status)}
                                <div>
                                  <p className="text-sm font-medium text-white">{file.file.name}</p>
                                  <p className="text-xs text-gray-400">
                                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  file.status === 'completed' ? 'default' :
                                  file.status === 'error' ? 'destructive' :
                                  file.status === 'processing' ? 'secondary' : 'outline'
                                }>
                                  {file.status}
                                </Badge>
                                {file.status === 'pending' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(file.id)}
                                    disabled={processing}
                                    className="text-white hover:bg-white/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Process Button */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-6">
                        <Button
                          onClick={processBulkUpload}
                          disabled={processing || !institutionCode.trim()}
                          className="w-full h-12"
                        >
                          {processing ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Processing {uploadedFiles.filter(f => f.status === 'processing').length} of {uploadedFiles.length} files...
                            </>
                          ) : (
                            <>
                              <Brain className="mr-2 h-5 w-5" />
                              Process {uploadedFiles.length} Certificate{uploadedFiles.length !== 1 ? 's' : ''}
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Progress Bar */}
                    {processing && (
                      <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Processing certificates...</span>
                          <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Results */}
                {results.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Verification Results
                        </CardTitle>
                        <CardDescription>
                          Detailed analysis of your certificate verification
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {results.map((result, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <Card className={`border-l-4 ${
                                result.status === 'success' ? 'border-l-green-500' :
                                result.status === 'warning' ? 'border-l-yellow-500' :
                                'border-l-red-500'
                              }`}>
                                <CardContent className="pt-6">
                                  <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h4 className="font-semibold">{result.fileName}</h4>
                                        <p className="text-sm text-muted-foreground">{result.message}</p>
                                      </div>
                                      <Badge className={getStatusColor(result.status)}>
                                        {result.status.toUpperCase()}
                                      </Badge>
                                    </div>

                                    {result.extractedData && Object.keys(result.extractedData).length > 0 && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div>
                                          <h5 className="font-medium mb-2">Extracted Information</h5>
                                          <div className="space-y-1 text-sm">
                                            {result.extractedData.studentName && (
                                              <p><span className="text-muted-foreground">Student:</span> {result.extractedData.studentName}</p>
                                            )}
                                            {result.extractedData.course && (
                                              <p><span className="text-muted-foreground">Course:</span> {result.extractedData.course}</p>
                                            )}
                                            {result.extractedData.institution && (
                                              <p><span className="text-muted-foreground">Institution:</span> {result.extractedData.institution}</p>
                                            )}
                                            {result.extractedData.issueDate && (
                                              <p><span className="text-muted-foreground">Issue Date:</span> {result.extractedData.issueDate}</p>
                                            )}
                                          </div>
                                        </div>
                                        <div>
                                          <h5 className="font-medium mb-2">Verification Status</h5>
                                          <div className="space-y-1 text-sm">
                                            <div className="flex items-center gap-2">
                                              {result.verification.blockchainRegistered ? 
                                                <CheckCircle className="h-4 w-4 text-green-500" /> : 
                                                <XCircle className="h-4 w-4 text-red-500" />
                                              }
                                              <span>Blockchain Registered</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {result.verification.aiVerified ? 
                                                <CheckCircle className="h-4 w-4 text-green-500" /> : 
                                                <XCircle className="h-4 w-4 text-red-500" />
                                              }
                                              <span>AI Verified</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {result.verification.documentIntegrity ? 
                                                <CheckCircle className="h-4 w-4 text-green-500" /> : 
                                                <XCircle className="h-4 w-4 text-red-500" />
                                              }
                                              <span>Document Integrity</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {result.certificateId && (
                                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                        <p className="text-sm">
                                          <span className="font-medium">Certificate ID:</span> 
                                          <code className="ml-2 text-blue-600">{result.certificateId}</code>
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            </TabsContent>

            {/* Single Verification Tab */}
            <TabsContent value="single">
              <Card className="bg-oxford_blue/90 backdrop-blur-sm border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Search className="h-5 w-5" />
                    Single Certificate Verification
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Verify a single certificate by ID or upload a certificate file
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 ">
                    <Shield className="h-16 w-16 mx-auto mb-4 text-white opacity-50" />
                    <h3 className="text-lg font-semibold mb-2 text-white">Single Verification</h3>
                    <p className="text-gray-300 mb-6">
                      Use the dashboard for single certificate verification
                    </p>
                    <Link href="/dashboard">
                      <Button className="bg-white text-rich_black hover:bg-gray-200">
                        <Shield className="mr-2 h-4 w-4" />
                        Go to Dashboard
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}