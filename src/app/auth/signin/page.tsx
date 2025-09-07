'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Building, Users, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
    type: 'institute' as 'institute' | 'employer'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(form.email, form.password, form.type);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/landing" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-xl text-gray-900">CertiCheck</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account to continue</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Access your certificate verification dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={form.type} onValueChange={(value) => setForm({...form, type: value as 'institute' | 'employer'})} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="institute" className="flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Institution
                </TabsTrigger>
                <TabsTrigger value="employer" className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Employer
                </TabsTrigger>
              </TabsList>

              <TabsContent value="institute">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Institution Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@university.edu"
                      value={form.email}
                      onChange={(e) => setForm({...form, email: e.target.value})}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={(e) => setForm({...form, password: e.target.value})}
                        required
                        disabled={loading}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                      Forgot password?
                    </Link>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In to Institution'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="employer">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@company.com"
                      value={form.email}
                      onChange={(e) => setForm({...form, email: e.target.value})}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={(e) => setForm({...form, password: e.target.value})}
                        required
                        disabled={loading}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                      Forgot password?
                    </Link>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In as Employer'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="mt-4 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-blue-900 mb-2">Demo Credentials:</p>
            <div className="text-xs text-blue-800 space-y-1">
              <p><strong>Institution:</strong> admin@university.edu / password123</p>
              <p><strong>Employer:</strong> john@company.com / password123</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500">
          Protected by advanced encryption and blockchain security
        </div>
      </div>
    </div>
  );
}
