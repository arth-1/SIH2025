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
  XCircle
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

export default function DashboardPage() {
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
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CertiCheck</h1>
                <p className="text-sm text-gray-600">{user?.instituteName || user?.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.instituteName || user?.email}!
          </h2>
          <p className="text-gray-600">
            Manage and verify your institution's certificates with blockchain security
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                +4 from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verified}</div>
              <p className="text-xs text-muted-foreground">
                100% verification rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recent}</div>
              <p className="text-xs text-muted-foreground">
                New certificates issued
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Register Certificate
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Verify Certificate
              </CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Manage Certificates
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="register">Register</TabsTrigger>
            <TabsTrigger value="verify">Verify</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
          </TabsList>
          
          {/* Register Certificate Tab */}
          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Register New Certificate</CardTitle>
                <CardDescription>
                  Upload and register a new certificate on the blockchain
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}
                  
                {success && (
                  <Alert className="mb-4 border-green-200 bg-green-50">
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleRegisterCertificate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="studentName">Student Name (Optional)</Label>
                      <Input
                        id="studentName"
                        value={registerForm.studentName}
                        onChange={(e) => setRegisterForm({...registerForm, studentName: e.target.value})}
                        placeholder="John Doe"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rollNumber">Roll Number (Optional)</Label>
                      <Input
                        id="rollNumber"
                        value={registerForm.rollNumber}
                        onChange={(e) => setRegisterForm({...registerForm, rollNumber: e.target.value})}
                        placeholder="2021001"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="courseName">Course Name (Optional)</Label>
                    <Input
                      id="courseName"
                      value={registerForm.courseName}
                      onChange={(e) => setRegisterForm({...registerForm, courseName: e.target.value})}
                      placeholder="Bachelor of Science in Computer Science"
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="issueDate">Issue Date (Optional)</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={registerForm.issueDate}
                      onChange={(e) => setRegisterForm({...registerForm, issueDate: e.target.value})}
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="certificateFile">Certificate File (PDF/Image) - Required</Label>
                    <Input
                      id="certificateFile"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setRegisterForm({...registerForm, file: e.target.files?.[0] || null})}
                      required
                      disabled={loading}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      File upload is required. You can leave other fields empty and they will be set to default values.
                    </p>
                  </div>
                  
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering on Blockchain...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
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
            <Card>
              <CardHeader>
                <CardTitle>Verify Certificate</CardTitle>
                <CardDescription>
                  Verify certificates by ID or search by student details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                <Tabs defaultValue="cert-id" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="cert-id">By Certificate ID</TabsTrigger>
                    <TabsTrigger value="student-search">By Student Details</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="cert-id" className="space-y-4">
                    <form onSubmit={handleVerifyCertificate} className="space-y-4">
                      <div>
                        <Label htmlFor="certificateId">Certificate ID</Label>
                        <Input
                          id="certificateId"
                          value={verifyForm.certificateId}
                          onChange={(e) => setVerifyForm({...verifyForm, certificateId: e.target.value})}
                          placeholder="CERT_1234567890"
                          required
                          disabled={loading}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="verifyFile">Certificate File (Optional - for integrity check)</Label>
                        <Input
                          id="verifyFile"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setVerifyForm({...verifyForm, file: e.target.files?.[0] || null})}
                          disabled={loading}
                        />
                      </div>
                      
                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Search className="mr-2 h-4 w-4" />
                            Verify Certificate
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="student-search" className="space-y-4">
                    <form onSubmit={handleStudentSearch} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="searchStudentName">Student Name</Label>
                          <Input
                            id="searchStudentName"
                            value={studentSearchForm.studentName}
                            onChange={(e) => setStudentSearchForm({...studentSearchForm, studentName: e.target.value})}
                            placeholder="John Doe"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <Label htmlFor="searchRollNumber">Roll Number</Label>
                          <Input
                            id="searchRollNumber"
                            value={studentSearchForm.rollNumber}
                            onChange={(e) => setStudentSearchForm({...studentSearchForm, rollNumber: e.target.value})}
                            placeholder="2021001"
                            disabled={loading}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="searchCourseName">Course Name</Label>
                          <Input
                            id="searchCourseName"
                            value={studentSearchForm.courseName}
                            onChange={(e) => setStudentSearchForm({...studentSearchForm, courseName: e.target.value})}
                            placeholder="Computer Science"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <Label htmlFor="searchInstitutionName">Institution Name</Label>
                          <Input
                            id="searchInstitutionName"
                            value={studentSearchForm.institutionName}
                            onChange={(e) => setStudentSearchForm({...studentSearchForm, institutionName: e.target.value})}
                            placeholder="University Name"
                            disabled={loading}
                          />
                        </div>
                      </div>
                      
                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? (
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
                    </form>

                    {/* Student Search Results */}
                    {studentSearchResults.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">Search Results ({studentSearchResults.length} found)</h3>
                        <div className="space-y-3">
                          {studentSearchResults.map((cert, index) => (
                            <Card key={index} className="border-blue-200 bg-blue-50">
                              <CardContent className="pt-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <strong>Certificate ID:</strong> {cert.certificateId}
                                  </div>
                                  <div>
                                    <strong>Student:</strong> {cert.studentName}
                                  </div>
                                  <div>
                                    <strong>Roll No:</strong> {cert.rollNumber}
                                  </div>
                                  <div>
                                    <strong>Course:</strong> {cert.course}
                                  </div>
                                  <div>
                                    <strong>Institution:</strong> {cert.institution}
                                  </div>
                                  <div>
                                    <strong>Grade:</strong> {cert.grade}
                                  </div>
                                  <div>
                                    <strong>Issue Date:</strong> {cert.issueDate}
                                  </div>
                                  <div>
                                    <Badge variant={cert.isBlacklisted ? "destructive" : "default"}>
                                      {cert.isBlacklisted ? "Blacklisted" : cert.verificationStatus}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Verification Result for Certificate ID search */}
                {verificationResult && (
                  <div className="mt-6">
                    <Card className={verificationResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          {verificationResult.isValid ? (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                              Certificate Verified
                            </>
                          ) : (
                            <>
                              <XCircle className="h-5 w-5 text-red-600 mr-2" />
                              Invalid Certificate
                            </>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {verificationResult.certificate && (
                          <div className="space-y-2">
                            <p><strong>Student:</strong> {verificationResult.certificate.studentName}</p>
                            <p><strong>Course:</strong> {verificationResult.certificate.courseName}</p>
                            <p><strong>Institution:</strong> {verificationResult.certificate.institutionName}</p>
                            <p><strong>Issue Date:</strong> {verificationResult.certificate.issueDate}</p>
                            <p><strong>Verifications:</strong> {verificationResult.certificate.verificationCount}</p>
                            {verificationResult.transactionHash && (
                              <p><strong>Blockchain Hash:</strong> {verificationResult.transactionHash}</p>
                            )}
                          </div>
                        )}
                        {verificationResult.error && (
                          <p className="text-red-600">{verificationResult.error}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Certificates Tab */}
          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle>Manage Certificates</CardTitle>
                <CardDescription>
                  View and manage all registered certificates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {certificates.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No certificates found</p>
                ) : (
                  <div className="space-y-4">
                    {certificates.map((cert) => (
                      <Card key={cert._id} className="border-gray-200">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <p><strong>ID:</strong> {cert.certificateId}</p>
                              <p><strong>Student:</strong> {cert.studentName}</p>
                              <p><strong>Course:</strong> {cert.courseName}</p>
                              <p><strong>Issue Date:</strong> {cert.issueDate}</p>
                              <p><strong>Verifications:</strong> {cert.verificationCount}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={cert.isVerified ? "default" : "secondary"}>
                                {cert.isVerified ? "Verified" : "Pending"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
