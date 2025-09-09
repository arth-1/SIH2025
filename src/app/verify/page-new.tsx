'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { EnhancedVerifyCertificateForm } from '@/components/enhanced-verify-certificate-form';

export default function VerifyPage() {
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
              Certificate Verification
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Verify the authenticity of certificates using our advanced AI-powered system. 
              Upload a certificate file or search by student details.
            </p>
          </div>
        </div>

        {/* Enhanced Verification Form */}
        <div className="max-w-4xl mx-auto">
          <EnhancedVerifyCertificateForm />
        </div>
      </div>
    </div>
  );
}
