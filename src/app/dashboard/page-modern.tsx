'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'motion/react';
import { 
  Upload, 
  Shield, 
  CheckCircle, 
  Clock, 
  FileText, 
  Search, 
  BarChart3,
  Loader2,
  Download,
  Eye,
  XCircle,
  TrendingUp,
  Users,
  Building,
  Activity,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface Certificate {
  _id: string;
  certificateId: string;
  studentName: string;
  courseName: string;
  institutionName: string;
  issueDate: string;
  isVerified: boolean;
  verificationCount: number;
  blockchainHash: string;
}

export default function ModernDashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    recent: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Certificate registration form
  const [registerForm, setRegisterForm] = useState({
    studentName: '',
    rollNumber: '',
    courseName: '',
    issueDate: '',
    file: null as File | null
  });

  // Certificate verification form
  const [verifyForm, setVerifyForm] = useState({
    certificateId: '',
    file: null as File | null
  });

  // Student search form
  const [studentSearchForm, setStudentSearchForm] = useState({
    studentName: '',
    rollNumber: '',
    courseName: '',
    institutionName: ''
  });

  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch statistics
      const statsResponse = await fetch('http://localhost:5000/api/certificates/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch certificates for institutions
      if (user?.type === 'institute') {
        const certsResponse = await fetch(`http://localhost:5000/api/certificates/institution/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (certsResponse.ok) {
          const certsData = await certsResponse.json();
          setCertificates(certsData);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleRegisterCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if file is provided
      if (!registerForm.file) {
        setError('Certificate file is required');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('studentName', registerForm.studentName || '');
      formData.append('rollNumber', registerForm.rollNumber || '');
      formData.append('courseName', registerForm.courseName || '');
      formData.append('institutionName', user?.instituteName || 'Unknown');
      formData.append('issueDate', registerForm.issueDate || '');
      formData.append('institutionId', user?.id || '');
      formData.append('certificateFile', registerForm.file);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/certificates/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(`Certificate registered successfully! Certificate ID: ${data.certificateId}`);
      setRegisterForm({
        studentName: '',
        rollNumber: '',
        courseName: '',
        issueDate: '',
        file: null
      });
      
      // Refresh data
      fetchDashboardData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      const formData = new FormData();
      formData.append('certificateId', verifyForm.certificateId);
      
      if (verifyForm.file) {
        formData.append('certificateFile', verifyForm.file);
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

  const handleStudentSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStudentSearchResults([]);

    try {
      const searchData = {
        studentName: studentSearchForm.studentName,
        rollNumber: studentSearchForm.rollNumber,
        courseName: studentSearchForm.courseName,
        institutionName: studentSearchForm.institutionName
      };

      const response = await fetch('http://localhost:5000/api/enhanced-certificates/find-by-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setStudentSearchResults(data.certificates || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8">
      {/* Hero Section with Bento Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">
            Welcome back, {user?.instituteName || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Manage and verify your institution's certificates with blockchain security
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Main Stats - Takes more space */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="h-full bg-rich_black border-oxford_blue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="h-5 w-5" />
                  Certificate Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-400">Total Certificates</p>
                    <p className="text-3xl font-bold text-white">{stats.total}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-400">Verified</p>
                    <p className="text-3xl font-bold text-white">{stats.verified}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <TrendingUp className="h-4 w-4" />
                  <span>+{stats.recent} this month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 bg-rich_black border-oxford_blue">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-oxford_blue rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-white">Register</h3>
                <p className="text-sm text-gray-400">New Certificate</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 bg-rich_black border-oxford_blue">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-oxford_blue rounded-full flex items-center justify-center">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-white">Verify</h3>
                <p className="text-sm text-gray-400">Certificate</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Feed */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="h-full bg-rich_black border-oxford_blue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {certificates.slice(0, 3).map((cert, index) => (
                    <div key={cert._id} className="flex items-center gap-3 p-3 rounded-lg bg-oxford_blue/50">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-white">{cert.studentName || 'Student'}</p>
                        <p className="text-xs text-gray-400">{cert.courseName || 'Certificate registered'}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-oxford_blue text-white">
                        {cert.isVerified ? 'Verified' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                  {certificates.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No certificates yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Status */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="h-full bg-rich_black border-oxford_blue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart3 className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                    <div>
                      <p className="text-sm font-medium text-white">Blockchain</p>
                      <p className="text-xs text-gray-400">Online</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                    <div>
                      <p className="text-sm font-medium text-white">AI Verification</p>
                      <p className="text-xs text-gray-400">Active</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                    <div>
                      <p className="text-sm font-medium text-white">Database</p>
                      <p className="text-xs text-gray-400">Connected</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-white"></div>
                    <div>
                      <p className="text-sm font-medium text-white">API</p>
                      <p className="text-xs text-gray-400">Healthy</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-oxford_blue text-white">
            <TabsTrigger value="register" className="flex items-center gap-2 data-[state=active]:bg-rich_black data-[state=active]:text-white text-gray-300">
              <Upload className="h-4 w-4" />
              Register
            </TabsTrigger>
            <TabsTrigger value="verify" className="flex items-center gap-2 data-[state=active]:bg-rich_black data-[state=active]:text-white text-gray-300">
              <Search className="h-4 w-4" />
              Verify
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2 data-[state=active]:bg-rich_black data-[state=active]:text-white text-gray-300">
              <FileText className="h-4 w-4" />
              Manage
            </TabsTrigger>
          </TabsList>
          
          {/* Register Certificate Tab */}
          <TabsContent value="register">
            <Card className="bg-rich_black border-oxford_blue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Upload className="h-5 w-5" />
                  Register New Certificate
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Upload and register a new certificate on the blockchain with AI-powered verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-4 border-red-500 bg-rich_black">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                  </Alert>
                )}
                  
                {success && (
                  <Alert className="mb-4 border-white bg-rich_black">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-white">{success}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleRegisterCertificate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentName" className="text-white">Student Name (Optional)</Label>
                      <Input
                        id="studentName"
                        value={registerForm.studentName}
                        onChange={(e) => setRegisterForm({...registerForm, studentName: e.target.value})}
                        placeholder="John Doe"
                        disabled={loading}
                        className="transition-all duration-200 focus:ring-2 focus:ring-white bg-oxford_blue text-white placeholder:text-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rollNumber" className="text-white">Roll Number (Optional)</Label>
                      <Input
                        id="rollNumber"
                        value={registerForm.rollNumber}
                        onChange={(e) => setRegisterForm({...registerForm, rollNumber: e.target.value})}
                        placeholder="2021001"
                        disabled={loading}
                        className="transition-all duration-200 focus:ring-2 focus:ring-white bg-oxford_blue text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="courseName" className="text-white">Course Name (Optional)</Label>
                    <Input
                      id="courseName"
                      value={registerForm.courseName}
                      onChange={(e) => setRegisterForm({...registerForm, courseName: e.target.value})}
                      placeholder="Bachelor of Science in Computer Science"
                      disabled={loading}
                      className="transition-all duration-200 focus:ring-2 focus:ring-white bg-oxford_blue text-white placeholder:text-gray-400"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="issueDate" className="text-white">Issue Date (Optional)</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={registerForm.issueDate}
                      onChange={(e) => setRegisterForm({...registerForm, issueDate: e.target.value})}
                      disabled={loading}
                      className="transition-all duration-200 focus:ring-2 focus:ring-white bg-oxford_blue text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="certificateFile" className="text-white">Certificate File (PDF/Image) - Required</Label>
                    <Input
                      id="certificateFile"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setRegisterForm({...registerForm, file: e.target.files?.[0] || null})}
                      required
                      disabled={loading}
                      className="transition-all duration-200 focus:ring-2 focus:ring-white bg-oxford_blue text-white file:bg-oxford_blue file:text-white file:border-none file:rounded file:px-3 file:py-1 file:mr-3"
                    />
                    <p className="text-sm text-gray-400">
                      File upload is required. AI will extract data from the certificate automatically.
                    </p>
                  </div>
                  
                  <Button type="submit" disabled={loading} className="w-full h-12 text-base">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Registering on Blockchain...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-5 w-5" />
                        Register Certificate
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verify Certificate Tab */}
          <TabsContent value="verify">
            <Card className="bg-rich_black border-oxford_blue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Search className="h-5 w-5" />
                  Verify Certificate
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Verify certificates by ID or search by student details with AI-powered fraud detection
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-4 border-red-500 bg-rich_black">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                  </Alert>
                )}

                <Tabs defaultValue="cert-id" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-oxford_blue text-white">
                    <TabsTrigger value="cert-id" className="data-[state=active]:bg-rich_black data-[state=active]:text-white text-gray-300">By Certificate ID</TabsTrigger>
                    <TabsTrigger value="student-search" className="data-[state=active]:bg-rich_black data-[state=active]:text-white text-gray-300">By Student Details</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="cert-id" className="space-y-4">
                    <form onSubmit={handleVerifyCertificate} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="certificateId" className="text-white">Certificate ID</Label>
                        <Input
                          id="certificateId"
                          value={verifyForm.certificateId}
                          onChange={(e) => setVerifyForm({...verifyForm, certificateId: e.target.value})}
                          placeholder="CERT_1234567890"
                          required
                          disabled={loading}
                          className="transition-all duration-200 focus:ring-2 focus:ring-white bg-oxford_blue text-white placeholder:text-gray-400"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="verifyFile" className="text-white">Certificate File (Optional - for integrity check)</Label>
                        <Input
                          id="verifyFile"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setVerifyForm({...verifyForm, file: e.target.files?.[0] || null})}
                          disabled={loading}
                          className="transition-all duration-200 focus:ring-2 focus:ring-white bg-oxford_blue text-white placeholder:text-gray-400"
                        />
                        <p className="text-sm text-gray-400">
                          Upload file for additional AI-powered authenticity verification
                        </p>
                      </div>
                      
                      <Button type="submit" disabled={loading} className="w-full h-12">
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Search className="mr-2 h-5 w-5" />
                            Verify Certificate
                          </>
                        )}
                      </Button>
                    </form>

                    {verificationResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6"
                      >
                        <Card className={`border-2 ${verificationResult.isValid ? 'border-white bg-rich_black' : 'border-red-500 bg-rich_black'}`}>
                          <CardHeader>
                            <CardTitle className={`flex items-center gap-2 ${verificationResult.isValid ? 'text-white' : 'text-red-400'}`}>
                              {verificationResult.isValid ? (
                                <>
                                  <CheckCircle className="h-5 w-5" />
                                  Certificate Verified
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-5 w-5" />
                                  Certificate Invalid
                                </>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {verificationResult.isValid && verificationResult.certificate && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="font-medium text-white">Student Name:</p>
                                    <p className="text-gray-400">{verificationResult.certificate.studentName || 'Not specified'}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-white">Course:</p>
                                    <p className="text-gray-400">{verificationResult.certificate.courseName || 'Not specified'}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-white">Institution:</p>
                                    <p className="text-gray-400">{verificationResult.certificate.institutionName}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-white">Issue Date:</p>
                                    <p className="text-gray-400">{verificationResult.certificate.issueDate || 'Not specified'}</p>
                                  </div>
                                </div>
                                <div className="pt-3 border-t border-oxford_blue">
                                  <p className="font-medium text-white">Blockchain Hash:</p>
                                  <p className="text-xs text-gray-400 font-mono break-all">{verificationResult.certificate.blockchainHash}</p>
                                </div>
                              </div>
                            )}
                            {!verificationResult.isValid && (
                              <p className="text-red-400">
                                {verificationResult.message || 'Certificate could not be verified. It may be invalid or not registered in our system.'}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="student-search" className="space-y-4">
                    <form onSubmit={handleStudentSearch} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="searchStudentName" className="text-white">Student Name</Label>
                          <Input
                            id="searchStudentName"
                            value={studentSearchForm.studentName}
                            onChange={(e) => setStudentSearchForm({...studentSearchForm, studentName: e.target.value})}
                            placeholder="John Doe"
                            disabled={loading}
                            className="transition-all duration-200 focus:ring-2 focus:ring-white bg-oxford_blue text-white placeholder:text-gray-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="searchRollNumber" className="text-white">Roll Number</Label>
                          <Input
                            id="searchRollNumber"
                            value={studentSearchForm.rollNumber}
                            onChange={(e) => setStudentSearchForm({...studentSearchForm, rollNumber: e.target.value})}
                            placeholder="2021001"
                            disabled={loading}
                            className="transition-all duration-200 focus:ring-2 focus:ring-white bg-oxford_blue text-white placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="searchCourseName" className="text-white">Course Name</Label>
                          <Input
                            id="searchCourseName"
                            value={studentSearchForm.courseName}
                            onChange={(e) => setStudentSearchForm({...studentSearchForm, courseName: e.target.value})}
                            placeholder="Computer Science"
                            disabled={loading}
                            className="transition-all duration-200 focus:ring-2 focus:ring-white bg-oxford_blue text-white placeholder:text-gray-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="searchInstitutionName" className="text-white">Institution Name</Label>
                          <Input
                            id="searchInstitutionName"
                            value={studentSearchForm.institutionName}
                            onChange={(e) => setStudentSearchForm({...studentSearchForm, institutionName: e.target.value})}
                            placeholder="University Name"
                            disabled={loading}
                            className="transition-all duration-200 focus:ring-2 focus:ring-white bg-oxford_blue text-white placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                      
                      <Button type="submit" disabled={loading} className="w-full h-12">
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <Users className="mr-2 h-5 w-5" />
                            Search Certificates
                          </>
                        )}
                      </Button>
                    </form>

                    {studentSearchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 space-y-4"
                      >
                        <h3 className="text-lg font-semibold">Search Results</h3>
                        {studentSearchResults.map((result, index) => (
                          <Card key={index} className="border-l-4 border-l-blue-500">
                            <CardContent className="pt-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="font-medium">Certificate ID:</p>
                                  <p className="text-sm text-muted-foreground">{result.certificateId}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Student:</p>
                                  <p className="text-sm text-muted-foreground">{result.studentName || 'Not specified'}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Course:</p>
                                  <p className="text-sm text-muted-foreground">{result.courseName || 'Not specified'}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Status:</p>
                                  <Badge variant={result.isVerified ? 'default' : 'secondary'}>
                                    {result.isVerified ? 'Verified' : 'Pending'}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </motion.div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Certificates Tab */}
          <TabsContent value="manage">
            <Card className="bg-rich_black border-oxford_blue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5" />
                  Manage Certificates
                </CardTitle>
                <CardDescription className="text-gray-400">
                  View and manage all certificates issued by your institution
                </CardDescription>
              </CardHeader>
              <CardContent>
                {certificates.length > 0 ? (
                  <div className="space-y-4">
                    {certificates.map((cert) => (
                      <motion.div
                        key={cert._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="hover:shadow-md transition-shadow bg-oxford_blue/50 border-oxford_blue">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                                <div>
                                  <p className="font-medium text-white">Certificate ID:</p>
                                  <p className="text-sm text-gray-400 font-mono">{cert.certificateId}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-white">Student:</p>
                                  <p className="text-sm text-gray-400">{cert.studentName || 'Not specified'}</p>
                                </div>
                                <div>
                                  <p className="font-medium text-white">Course:</p>
                                  <p className="text-sm text-gray-400">{cert.courseName || 'Not specified'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={cert.isVerified ? 'default' : 'secondary'} className="bg-oxford_blue text-white">
                                  {cert.isVerified ? 'Verified' : 'Pending'}
                                </Badge>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
                    <h3 className="text-lg font-semibold text-white mb-2">No certificates found</h3>
                    <p className="text-sm text-gray-400 mb-6">Start by registering your first certificate</p>
                    <Button onClick={() => {
                      const tabsList = document.querySelector('[value="register"]') as HTMLElement;
                      tabsList?.click();
                    }}>
                      <Upload className="mr-2 h-4 w-4" />
                      Register Certificate
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}