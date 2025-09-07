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
  Eye
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
    courseName: '',
    issueDate: '',
    file: null as File | null
  });

  // Certificate verification form
  const [verifyForm, setVerifyForm] = useState({
    certificateId: '',
    file: null as File | null
  });

  const [verificationResult, setVerificationResult] = useState<any>(null);

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
              <span className="font-bold text-xl text-gray-900">CertiCheck</span>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                {user.type === 'institute' ? user.instituteName : `${user.firstName} ${user.lastName}`}
              </Badge>
              <Button variant="outline" onClick={logout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.type === 'institute' ? user.instituteName : user.firstName}!
          </h1>
          <p className="text-gray-600">
            {user.type === 'institute' 
              ? 'Manage and verify your institution\'s certificates with blockchain security'
              : 'Verify academic credentials with confidence'
            }
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
                +{stats.recent} from last month
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
                {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}% verification rate
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

        {/* Main Content */}
        <Tabs defaultValue={user.type === 'institute' ? 'register' : 'verify'} className="space-y-6">
          <TabsList>
            {user.type === 'institute' && (
              <TabsTrigger value="register">Register Certificate</TabsTrigger>
            )}
            <TabsTrigger value="verify">Verify Certificate</TabsTrigger>
            {user.type === 'institute' && (
              <TabsTrigger value="manage">Manage Certificates</TabsTrigger>
            )}
          </TabsList>

          {/* Register Certificate Tab (Institution only) */}
          {user.type === 'institute' && (
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
                        <Label htmlFor="courseName">Course Name (Optional)</Label>
                        <Input
                          id="courseName"
                          value={registerForm.courseName}
                          onChange={(e) => setRegisterForm({...registerForm, courseName: e.target.value})}
                          placeholder="Bachelor of Science in Computer Science"
                          disabled={loading}
                        />
                      </div>
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
          )}

          {/* Verify Certificate Tab */}
          <TabsContent value="verify">
            <Card>
              <CardHeader>
                <CardTitle>Verify Certificate</CardTitle>
                <CardDescription>
                  Verify the authenticity of a certificate using blockchain technology
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

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

                {/* Verification Result */}
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
                              <Clock className="h-5 w-5 text-red-600 mr-2" />
                              Verification Failed
                            </>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {verificationResult.isValid ? (
                          <div className="space-y-2">
                            <p><strong>Student:</strong> {verificationResult.certificate.studentName}</p>
                            <p><strong>Course:</strong> {verificationResult.certificate.courseName}</p>
                            <p><strong>Institution:</strong> {verificationResult.certificate.institutionName}</p>
                            <p><strong>Issue Date:</strong> {new Date(verificationResult.certificate.issueDate).toLocaleDateString()}</p>
                            <p><strong>Verification Count:</strong> {verificationResult.certificate.verificationCount}</p>
                            {verificationResult.documentIntegrity && (
                              <p><strong>Document Integrity:</strong> 
                                <span className={verificationResult.documentIntegrity.verified ? 'text-green-600' : 'text-red-600'}>
                                  {verificationResult.documentIntegrity.verified ? ' ✓ Verified' : ' ✗ Tampered'}
                                </span>
                              </p>
                            )}
                            <p className="text-sm text-gray-600">
                              <strong>Transaction Hash:</strong> {verificationResult.transactionHash}
                            </p>
                          </div>
                        ) : (
                          <p className="text-red-800">{verificationResult.error}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Certificates Tab (Institution only) */}
          {user.type === 'institute' && (
            <TabsContent value="manage">
              <Card>
                <CardHeader>
                  <CardTitle>Your Certificates</CardTitle>
                  <CardDescription>
                    Manage all certificates issued by your institution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {certificates.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No certificates found. Register your first certificate to get started.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {certificates.map((cert) => (
                        <Card key={cert._id} className="border">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">{cert.studentName}</h3>
                                <p className="text-sm text-gray-600">{cert.courseName}</p>
                                <p className="text-xs text-gray-500">
                                  ID: {cert.certificateId} | Issued: {new Date(cert.issueDate).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant={cert.isVerified ? 'default' : 'secondary'}>
                                  {cert.isVerified ? 'Verified' : 'Pending'}
                                </Badge>
                                <p className="text-xs text-gray-500 mt-1">
                                  Verified {cert.verificationCount} times
                                </p>
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
          )}
        </Tabs>
      </div>
    </div>
  );
}
