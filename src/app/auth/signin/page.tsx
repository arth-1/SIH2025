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
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-gray-300 mt-2">Sign in to your account to continue</p>
        </div>

        <Card className="shadow-lg border-0 bg-oxford_blue/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Sign In</CardTitle>
            <CardDescription className="text-gray-300">
              Access your certificate verification dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-500/20 backdrop-blur-sm">
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={form.type} onValueChange={(value) => setForm({...form, type: value as 'institute' | 'employer'})} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-rich_black/50">
                <TabsTrigger value="institute" className="flex items-center text-white data-[state=active]:bg-white data-[state=active]:text-rich_black">
                  <Building className="h-4 w-4 mr-2" />
                  Institution
                </TabsTrigger>
                <TabsTrigger value="employer" className="flex items-center text-white data-[state=active]:bg-white data-[state=active]:text-rich_black">
                  <Users className="h-4 w-4 mr-2" />
                  Employer
                </TabsTrigger>
              </TabsList>

              <TabsContent value="institute">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-white">Institution Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@university.edu"
                      value={form.email}
                      onChange={(e) => setForm({...form, email: e.target.value})}
                      required
                      disabled={loading}
                      className="bg-oxford_blue text-white placeholder:text-gray-400 border-gray-600 focus:border-white focus:ring-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={(e) => setForm({...form, password: e.target.value})}
                        required
                        disabled={loading}
                        className="pr-10 bg-oxford_blue text-white placeholder:text-gray-400 border-gray-600 focus:border-white focus:ring-white"
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
                    <Link href="/auth/forgot-password" className="text-sm text-white hover:text-gray-200">
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
                    <Label htmlFor="email" className="text-white">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@company.com"
                      value={form.email}
                      onChange={(e) => setForm({...form, email: e.target.value})}
                      required
                      disabled={loading}
                      className="bg-oxford_blue text-white placeholder:text-gray-400 border-gray-600 focus:border-white focus:ring-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={(e) => setForm({...form, password: e.target.value})}
                        required
                        disabled={loading}
                        className="pr-10 bg-oxford_blue text-white placeholder:text-gray-400 border-gray-600 focus:border-white focus:ring-white"
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
                    <Link href="/auth/forgot-password" className="text-sm text-white hover:text-gray-200">
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
              <p className="text-sm text-gray-300">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-white hover:text-gray-200 font-medium">
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="mt-4 bg-oxford_blue/50 border-gray-600 backdrop-blur-sm">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-white mb-2">Demo Credentials:</p>
            <div className="text-xs text-gray-300 space-y-1">
              <p><strong>Institution:</strong> admin@university.edu / password123</p>
              <p><strong>Employer:</strong> john@company.com / password123</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-400">
          Protected by advanced encryption and blockchain security
        </div>
      </div>
    </div>
  );
}
