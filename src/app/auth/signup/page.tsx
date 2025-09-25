'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Building, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const { register } = useAuth();
  const searchParams = useSearchParams();
  const defaultType = searchParams.get('type') || 'institute';

  const [instituteForm, setInstituteForm] = useState({
    instituteName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [employerForm, setEmployerForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInstituteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (instituteForm.password !== instituteForm.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (instituteForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await register({
        instituteName: instituteForm.instituteName,
        email: instituteForm.email,
        password: instituteForm.password
      }, 'institute');
      
      setSuccess('Registration successful! Redirecting to dashboard...');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (employerForm.password !== employerForm.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (employerForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await register({
        firstName: employerForm.firstName,
        lastName: employerForm.lastName,
        email: employerForm.email,
        password: employerForm.password
      }, 'employer');
      
      setSuccess('Registration successful! Redirecting to dashboard...');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rich_black via-oxford_blue to-yinmn_blue flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/landing" className="inline-flex items-center text-sm text-white hover:text-gray-200 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-8 w-8 text-white" />
            <span className="font-bold text-xl text-white">CertiCheck</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
          <p className="text-gray-300 mt-2">Join the future of certificate verification</p>
        </div>

        <Card className="shadow-lg border-0 bg-oxford_blue/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Sign Up</CardTitle>
            <CardDescription className="text-gray-300">
              Choose your account type to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-500/20 backdrop-blur-sm">
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4 border-green-200 bg-green-500/20 backdrop-blur-sm">
                <AlertDescription className="text-green-300">{success}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue={defaultType} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-rich_black/50">
                <TabsTrigger value="institute" className="flex items-center text-white data-[state=active]:bg-white data-[state=active]:text-rich_black">
                  <Building className="h-4 w-4 mr-2" />
                  Institution
                </TabsTrigger>
                <TabsTrigger value="employer" className="flex items-center text-white data-[state=active]:bg-white data-[state=active]:text-rich_black">
                  <Users className="h-4 w-4 mr-2" />
                  Employer
                </TabsTrigger>
              </TabsList>

              <TabsContent value="institute" className="space-y-4 mt-6">
                <form onSubmit={handleInstituteSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="instituteName" className="text-white">Institution Name</Label>
                    <Input
                      id="instituteName"
                      type="text"
                      placeholder="University of Technology"
                      value={instituteForm.instituteName}
                      onChange={(e) => setInstituteForm({...instituteForm, instituteName: e.target.value})}
                      required
                      disabled={loading}
                      className="bg-oxford_blue text-white placeholder:text-gray-400 border-gray-600 focus:border-white focus:ring-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instituteEmail" className="text-white">Email Address</Label>
                    <Input
                      id="instituteEmail"
                      type="email"
                      placeholder="admin@university.edu"
                      value={instituteForm.email}
                      onChange={(e) => setInstituteForm({...instituteForm, email: e.target.value})}
                      required
                      disabled={loading}
                      className="bg-oxford_blue text-white placeholder:text-gray-400 border-gray-600 focus:border-white focus:ring-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="institutePassword" className="text-white">Password</Label>
                    <Input
                      id="institutePassword"
                      type="password"
                      placeholder="Enter secure password"
                      value={instituteForm.password}
                      onChange={(e) => setInstituteForm({...instituteForm, password: e.target.value})}
                      required
                      disabled={loading}
                      className="bg-oxford_blue text-white placeholder:text-gray-400 border-gray-600 focus:border-white focus:ring-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instituteConfirmPassword" className="text-white">Confirm Password</Label>
                    <Input
                      id="instituteConfirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={instituteForm.confirmPassword}
                      onChange={(e) => setInstituteForm({...instituteForm, confirmPassword: e.target.value})}
                      required
                      disabled={loading}
                      className="bg-oxford_blue text-white placeholder:text-gray-400 border-gray-600 focus:border-white focus:ring-white"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Institution Account'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="employer" className="space-y-4 mt-6">
                <form onSubmit={handleEmployerSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-white">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={employerForm.firstName}
                        onChange={(e) => setEmployerForm({...employerForm, firstName: e.target.value})}
                        required
                        disabled={loading}
                        className="bg-oxford_blue text-white placeholder:text-gray-400 border-gray-600 focus:border-white focus:ring-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-white">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={employerForm.lastName}
                        onChange={(e) => setEmployerForm({...employerForm, lastName: e.target.value})}
                        required
                        disabled={loading}
                        className="bg-oxford_blue text-white placeholder:text-gray-400 border-gray-600 focus:border-white focus:ring-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="employerEmail" className="text-white">Email Address</Label>
                    <Input
                      id="employerEmail"
                      type="email"
                      placeholder="john.doe@company.com"
                      value={employerForm.email}
                      onChange={(e) => setEmployerForm({...employerForm, email: e.target.value})}
                      required
                      disabled={loading}
                      className="bg-oxford_blue text-white placeholder:text-gray-400 border-gray-600 focus:border-white focus:ring-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="employerPassword" className="text-white">Password</Label>
                    <Input
                      id="employerPassword"
                      type="password"
                      placeholder="Enter secure password"
                      value={employerForm.password}
                      onChange={(e) => setEmployerForm({...employerForm, password: e.target.value})}
                      required
                      disabled={loading}
                      className="bg-oxford_blue text-white placeholder:text-gray-400 border-gray-600 focus:border-white focus:ring-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="employerConfirmPassword" className="text-white">Confirm Password</Label>
                    <Input
                      id="employerConfirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={employerForm.confirmPassword}
                      onChange={(e) => setEmployerForm({...employerForm, confirmPassword: e.target.value})}
                      required
                      disabled={loading}
                      className="bg-oxford_blue text-white placeholder:text-gray-400 border-gray-600 focus:border-white focus:ring-white"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Employer Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-300">
                Already have an account?{' '}
                <Link href="/auth/signin" className="text-white hover:text-gray-200 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-400">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
}
